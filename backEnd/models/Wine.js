const mongoose = require('mongoose');

const wineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del vino es requerido'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'El tipo de vino es requerido'],
      enum: ['Tinto', 'Blanco', 'Rosado', 'Espumoso', 'Dulce'],
    },
    year: {
      type: Number,
      required: [true, 'El año es requerido'],
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    region: {
      type: String,
      required: [true, 'La región es requerida'],
      trim: true,
    },
    grapeVariety: [
      {
        name: { type: String, trim: true },
        percentage: { type: Number, min: 0, max: 100 },
      },
    ],
    alcoholContent: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'El stock es requerido'],
      min: 0,
      default: 0,
    },
    restaurantStock: {
      type: Number,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido'],
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
    awards: [String],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: Number,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Permitimos vinos sin dueño para seeds
    },
    updatedAtClient: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wine', wineSchema);

