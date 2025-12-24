const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    orderNumber: { type: String, required: true, trim: true },
    supplier: { type: String, required: true, trim: true },
    orderDate: { type: String },
    expectedDate: { type: String },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        completedBy: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String },
          avatar: { type: String }
        }
      },
    ],
    completing: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    status: { type: String, default: 'pending' },
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Order', orderSchema);

