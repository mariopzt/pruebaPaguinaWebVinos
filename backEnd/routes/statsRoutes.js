const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStats,
  registerSale,
  registerLoss,
  resetStats,
  getTopWines
} = require('../controllers/statsController');

// Obtener estadísticas
router.get('/', protect, getStats);

// Registrar venta
router.post('/sale', protect, registerSale);

// Registrar pérdida
router.post('/loss', protect, registerLoss);

// Obtener top vinos
router.get('/top-wines', protect, getTopWines);

// Resetear estadísticas (solo admin)
router.delete('/reset', protect, resetStats);

module.exports = router;

