const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Todas las rutas protegidas por usuario
router.route('/')
  .get(protect, getNotifications)
  .post(protect, createNotification);

router.patch('/read-all', protect, markAllAsRead);

router.route('/:id')
  .patch(protect, markAsRead)
  .delete(protect, deleteNotification);

module.exports = router;

