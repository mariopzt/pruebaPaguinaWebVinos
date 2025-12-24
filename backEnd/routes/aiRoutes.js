const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  processCommand,
  webSearch,
  getMemory,
  saveMemory,
  clearMemory
} = require('../controllers/aiController');

// Procesar comando de IA (requiere autenticación)
router.post('/command', protect, processCommand);

// Búsqueda web (requiere autenticación)
router.post('/web-search', protect, webSearch);

// Memoria de conversación
router.get('/memory', optionalAuth, getMemory);
router.post('/memory', optionalAuth, saveMemory);
router.delete('/memory', protect, clearMemory);

module.exports = router;

