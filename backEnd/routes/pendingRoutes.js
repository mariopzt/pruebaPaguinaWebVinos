const express = require('express');
const router = express.Router();
const {
  createPending,
  getPendingByToken,
  activatePending,
} = require('../controllers/pendingController');
const { optionalAuth } = require('../middleware/auth');

// Crear invitación (permite sin sesión, pero si hay usuario se asocia)
router.post('/', optionalAuth, createPending);

// Validar token (público)
router.get('/:token', getPendingByToken);

// Activar token (público, con password)
router.post('/activate/:token', activatePending);

module.exports = router;

