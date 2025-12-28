const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    type: {
      type: String,
      default: 'general',
      trim: true,
    },
    icon: {
      type: String,
      default: 'FiBell',
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    actions: {
      type: [String],
      default: [],
    },
    wineId: {
      type: String,
      required: false,
    },
    unread: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);

