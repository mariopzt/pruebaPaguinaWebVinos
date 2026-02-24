const express = require('express');
const router = express.Router();
const {
  getWines,
  getWine,
  createWine,
  updateWine,
  deleteWine,
  toggleLike
} = require('../controllers/wineController');
const { protect, optionalAuth } = require('../middleware/auth');

// Lectura pública/semiautenticada, escritura protegida
router.route('/')
  .get(optionalAuth, getWines)
  .post(protect, createWine);

router.route('/:id')
  .get(optionalAuth, getWine)
  .put(protect, updateWine)
  .delete(protect, deleteWine);

// Toggle like en un vino (permite invitados)
router.post('/:id/like', optionalAuth, toggleLike);

module.exports = router;

