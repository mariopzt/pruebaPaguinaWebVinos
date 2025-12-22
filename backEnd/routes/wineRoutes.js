const express = require('express');
const router = express.Router();
const {
  getWines,
  getWine,
  createWine,
  updateWine,
  deleteWine
} = require('../controllers/wineController');
const { protect } = require('../middleware/auth');

// Todas las rutas están protegidas
router.use(protect);

router.route('/')
  .get(getWines)
  .post(createWine);

router.route('/:id')
  .get(getWine)
  .put(updateWine)
  .delete(deleteWine);

module.exports = router;

