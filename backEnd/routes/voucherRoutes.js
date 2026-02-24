const express = require('express');
const router = express.Router();
const { getVouchers, createVoucher, updateVoucher, deleteVoucher } = require('../controllers/voucherController');
const { protect, optionalAuth } = require('../middleware/auth');

router.route('/')
  .get(optionalAuth, getVouchers)
  .post(protect, createVoucher);

router.route('/:id')
  .put(protect, updateVoucher)
  .delete(protect, deleteVoucher);

module.exports = router;
