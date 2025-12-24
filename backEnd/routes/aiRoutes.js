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

// Procesar comando de IA (acceso con autenticación opcional)
router.post('/command', optionalAuth, processCommand);

// Búsqueda web
router.post('/web-search', optionalAuth, webSearch);

// Memoria de conversación
router.get('/memory', optionalAuth, getMemory);
router.post('/memory', optionalAuth, saveMemory);
router.delete('/memory', optionalAuth, clearMemory);

module.exports = router;

