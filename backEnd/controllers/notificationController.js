const Notification = require('../models/Notification');
const User = require('../models/User');

const isTaskCompletionNotification = (notification = {}) => {
  const type = String(notification.type || '').toLowerCase();
  const title = String(notification.title || '').toLowerCase();
  const message = String(notification.message || '').toLowerCase();
  const actions = Array.isArray(notification.actions)
    ? notification.actions.map((action) => String(action || '').toLowerCase())
    : [];

  return (
    ['tarea-completada', 'task-completed'].includes(type) ||
    /tarea\s+completada/i.test(title) ||
    /nota\s+completada/i.test(title) ||
    /ha\s+completado\s+la\s+tarea/i.test(message) ||
    /ha\s+completado\s+la\s+nota/i.test(message) ||
    actions.includes('ver tareas')
  );
};

// GET /api/notifications (solo las del usuario)
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).lean();
    const visibleNotifications = notifications
      .filter((notification) => !isTaskCompletionNotification(notification))
      .sort((a, b) => {
        if (a.unread !== b.unread) return a.unread ? -1 : 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

    res.json({ success: true, data: visibleNotifications });
  } catch (error) {
    next(error);
  }
};

// POST /api/notifications
// Crea notificaciones para TODOS los usuarios EXCEPTO el que la genera
exports.createNotification = async (req, res, next) => {
  try {
    // Obtener todos los usuarios excepto el actual
    const otherUsers = await User.find({ _id: { $ne: req.user._id } }).select('_id');
    
    if (otherUsers.length === 0) {
      // Si no hay otros usuarios, no crear nada pero responder éxito
      return res.status(201).json({ success: true, data: null, message: 'No hay otros usuarios para notificar' });
    }

    const basePayload = {
      ...req.body,
      unread: true,
      createdAt: req.body.createdAt || new Date(),
      createdBy: req.user._id, // Guardar quién creó la notificación
    };

    if (isTaskCompletionNotification(basePayload)) {
      return res.status(200).json({ success: true, data: null, message: 'Notificación de tarea completada bloqueada' });
    }

    // Crear una notificación para cada usuario (excepto el creador)
    const notifications = await Promise.all(
      otherUsers.map(user => 
        Notification.create({ ...basePayload, user: user._id })
      )
    );

    res.status(201).json({ success: true, data: notifications[0], count: notifications.length });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { unread: false, readAt: new Date() },
      { new: true }
    );
    res.json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id },
      { unread: false, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

