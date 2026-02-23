const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    code: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    discountValue: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    usesLeft: { type: Number, default: 1, min: 0 },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['activo', 'usado'], default: 'activo' },
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Voucher', voucherSchema);
