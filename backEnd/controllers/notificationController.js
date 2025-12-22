const Notification = require('../models/Notification');

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
exports.createNotification = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      unread: true,
      createdAt: req.body.createdAt || new Date(),
      user: req.user._id,
    };
    const notification = await Notification.create(payload);
    res.status(201).json({ success: true, data: notification });
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

