const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getPublicKey,
  subscribe,
  unsubscribe,
} = require('../controllers/pushController');

router.get('/public-key', getPublicKey);
router.post('/subscribe', optionalAuth, subscribe);
router.post('/unsubscribe', optionalAuth, unsubscribe);

module.exports = router;
