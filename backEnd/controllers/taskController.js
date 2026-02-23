const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper para crear notificaciones para todos los usuarios excepto uno
const notifyAllUsersExcept = async (excludeUserId, notificationData) => {
  try {
    const users = await User.find({ _id: { $ne: excludeUserId } }).select('_id').lean();
    const notifications = users.map(user => ({
      ...notificationData,
      user: user._id,
      unread: true,
      createdAt: new Date()
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`[Notificaciones] Creadas ${notifications.length} notificaciones de tarea`);
    }
  } catch (error) {
    console.error('[Notificaciones] Error al crear:', error);
  }
};

const isTaskOwner = (task, userId) => task?.user && task.user.toString() === userId.toString();

exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const payload = { ...req.body, user: req.user._id };
    const task = await Task.create(payload);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    // Obtener la tarea antes del update para comparar y validar propietario
    const oldTask = await Task.findById(req.params.id);

    if (!oldTask) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    }

    if (!isTaskOwner(oldTask, req.user._id)) {
      return res.status(403).json({ success: false, message: 'No autorizado para editar esta tarea' });
    }

    const wasCompleted = oldTask.status === 'completed' || oldTask.status === 'completada';

    const updatePayload = { ...req.body };
    delete updatePayload.user;

    const task = await Task.findByIdAndUpdate(req.params.id, updatePayload, { new: true }).populate('user', 'name avatar');

    // Si la tarea acaba de completarse, notificar a todos los demás usuarios
    // solo cuando se solicite explícitamente.
    const isNowCompleted = task?.status === 'completed' || task?.status === 'completada';
    const shouldNotifyOthers = req.body?.notifyOthers === true || task?.metadata?.notifyOthers === true;
    console.log('[updateTask] wasCompleted:', wasCompleted, 'isNowCompleted:', isNowCompleted, 'status:', task?.status);

    if (isNowCompleted && !wasCompleted && shouldNotifyOthers && req.user) {
      console.log('[updateTask] Enviando notificación de tarea completada');
      await notifyAllUsersExcept(req.user._id, {
        type: 'tarea-completada',
        icon: 'FiCheckCircle',
        title: 'Tarea completada',
        message: `**${req.user.name || 'Un usuario'}** ha completado la tarea **"${task.title}"**`,
        actions: ['Ver tareas'],
        metadata: { taskId: task._id }
      });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    }

    if (!isTaskOwner(task, req.user._id)) {
      return res.status(403).json({ success: false, message: 'No autorizado para eliminar esta tarea' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
