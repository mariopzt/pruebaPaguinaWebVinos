const mongoose = require('mongoose');
const { queuePushForNotifications } = require('../services/pushService');

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

notificationSchema.post('save', function postSave(doc) {
  setImmediate(() => {
    queuePushForNotifications([doc]).catch((error) => {
      console.warn('No se pudo enviar push tras save:', error.message);
    });
  });
});

notificationSchema.post('insertMany', function postInsertMany(docs) {
  setImmediate(() => {
    queuePushForNotifications(docs || []).catch((error) => {
      console.warn('No se pudo enviar push tras insertMany:', error.message);
    });
  });
});

module.exports = mongoose.model('Notification', notificationSchema);

