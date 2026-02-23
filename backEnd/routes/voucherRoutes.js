const express = require('express');
const router = express.Router();
const { getVouchers, createVoucher, updateVoucher, deleteVoucher } = require('../controllers/voucherController');
const { optionalAuth } = require('../middleware/auth');

router.route('/')
  .get(optionalAuth, getVouchers)
  .post(optionalAuth, createVoucher);

router.route('/:id')
  .put(optionalAuth, updateVoucher)
  .delete(optionalAuth, deleteVoucher);

module.exports = router;
