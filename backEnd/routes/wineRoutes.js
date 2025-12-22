const express = require('express');
const router = express.Router();
const {
  getWines,
  getWine,
  createWine,
  updateWine,
  deleteWine
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

module.exports = router;

