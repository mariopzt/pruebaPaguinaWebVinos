const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    wine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wine',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    guestId: {
      type: String,
      trim: true
    },
    guestName: {
      type: String,
      trim: true,
      default: ''
    },
    guestAvatar: {
      type: String,
      trim: true,
      default: ''
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    },
    verified: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index(
  { wine: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true, $ne: null } } }
);
reviewSchema.index(
  { wine: 1, guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $exists: true, $type: 'string' } } }
);

module.exports = mongoose.model('Review', reviewSchema);
