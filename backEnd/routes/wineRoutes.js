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
  .post(optionalAuth, createWine);

router.route('/:id')
  .get(optionalAuth, getWine)
  .put(optionalAuth, updateWine)
  .delete(optionalAuth, deleteWine);

// Toggle like en un vino (permite invitados)
router.post('/:id/like', optionalAuth, toggleLike);

module.exports = router;

