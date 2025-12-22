const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const query = {};
    if (req.user) {
      query.$or = [{ user: req.user._id }, { user: null }];
    }
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
    };
    if (req.user && !payload.user) {
      payload.user = req.user._id;
    }
    const notification = await Notification.create(payload);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
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
    const query = {};
    if (req.user) {
      query.$or = [{ user: req.user._id }, { user: null }];
    }
    await Notification.updateMany(query, { unread: false, readAt: new Date() });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

