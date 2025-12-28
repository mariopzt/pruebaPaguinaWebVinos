const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/notifications (solo las del usuario)
exports.getNotifications = async (req, res, next) => {
  try {
    const query = { user: req.user._id };
    const notifications = await Notification.find(query)
      .sort({ unread: -1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: notifications });
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

