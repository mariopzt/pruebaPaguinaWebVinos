const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect, optionalAuth } = require('../middleware/auth');

// Lectura pública/semiautenticada, escritura protegida
router.route('/')
  .get(optionalAuth, getNotifications)
  .post(optionalAuth, createNotification);

router.patch('/read-all', optionalAuth, markAllAsRead);

router.route('/:id')
  .patch(optionalAuth, markAsRead)
  .delete(optionalAuth, deleteNotification);

module.exports = router;

