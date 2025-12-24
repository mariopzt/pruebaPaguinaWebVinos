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
      required: false,
      enum: ['Tinto', 'Blanco', 'Rosado', 'Espumoso', 'Dulce'],
      default: 'Tinto',
    },
    year: {
      type: Number,
      required: false,
      min: 1900,
      max: new Date().getFullYear() + 1,
      default: () => new Date().getFullYear() - Math.floor(Math.random() * 10),
    },
    region: {
      type: String,
      required: false,
      trim: true,
      default: 'España',
    },
    grape: {
      type: String,
      trim: true,
      default: '',
    },
    grapeVariety: {
      type: Array,
      default: [],
    },
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
      required: false,
      min: 0,
      default: () => Math.floor(Math.random() * 40) + 10,
    },
    restaurantStock: {
      type: Number,
      min: 0,
      default: () => Math.floor(Math.random() * 15) + 5,
    },
    price: {
      type: Number,
      required: false,
      min: 0,
      default: () => Math.floor(Math.random() * 30) + 8,
    },
    image: {
      type: String,
      default: function() {
        const wineImages = [
          'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
          'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400',
          'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=400',
          'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=400',
          'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400',
          'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=400',
          'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400',
          'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=400',
          'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400',
          'https://images.unsplash.com/photo-1543418219-44e30b057fea?w=400',
        ];
        return wineImages[Math.floor(Math.random() * wineImages.length)];
      },
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

