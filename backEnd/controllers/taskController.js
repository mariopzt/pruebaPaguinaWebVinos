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

exports.getTasks = async (req, res, next) => {
  try {
    // Mostrar todas las tareas, sin filtrar por usuario, e incluir nombre/avatar del usuario si existe
    const tasks = await Task.find({})
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
    const payload = { ...req.body };
    if (req.user && !payload.user) payload.user = req.user._id;
    const task = await Task.create(payload);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    // Obtener la tarea antes del update para comparar
    const oldTask = await Task.findById(req.params.id).lean();
    const wasCompleted = oldTask?.status === 'completed' || oldTask?.status === 'completada';
    
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user', 'name avatar');
    
    // Si la tarea acaba de completarse, notificar a todos los demás usuarios
    const isNowCompleted = task?.status === 'completed' || task?.status === 'completada';
    console.log('[updateTask] wasCompleted:', wasCompleted, 'isNowCompleted:', isNowCompleted, 'status:', task?.status);
    
    if (isNowCompleted && !wasCompleted && req.user) {
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
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

