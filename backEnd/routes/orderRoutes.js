const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrder, deleteOrder } = require('../controllers/orderController');
const { optionalAuth } = require('../middleware/auth');

router.route('/')
  .get(optionalAuth, getOrders)
  .post(optionalAuth, createOrder);

router.route('/:id')
  .put(optionalAuth, updateOrder)
  .delete(optionalAuth, deleteOrder);

module.exports = router;

