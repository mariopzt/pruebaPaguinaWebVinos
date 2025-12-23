const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    token: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('PendingUser', pendingUserSchema);

