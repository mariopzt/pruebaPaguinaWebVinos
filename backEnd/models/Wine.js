const mongoose = require('mongoose');

const wineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del vino es requerido'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'El tipo de vino es requerido'],
    enum: ['Tinto', 'Blanco', 'Rosado', 'Espumoso', 'Dulce']
  },
  year: {
    type: Number,
    required: [true, 'El año es requerido'],
    min: 1900,
    max: new Date().getFullYear()
  },
  origin: {
    type: String,
    required: [true, 'El origen es requerido'],
    trim: true
  },
  grape: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: 0
  },
  stock: {
    type: Number,
    required: [true, 'El stock es requerido'],
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: '/images/wine-default.jpg'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Wine', wineSchema);

