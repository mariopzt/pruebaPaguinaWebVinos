const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    visual: { type: Number, min: 0, max: 10, default: 0 },
    aroma: { type: Number, min: 0, max: 10, default: 0 },
    taste: { type: Number, min: 0, max: 10, default: 0 },
    texture: { type: Number, min: 0, max: 10, default: 0 },
    finish: { type: Number, min: 0, max: 10, default: 0 },
  },
  { _id: false }
);

const cataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la cata es requerido'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Vino', 'Cafe', 'Comida', 'Cerveza', 'Queso', 'Chocolate', 'Otro'],
      default: 'Vino',
    },
    producer: { type: String, trim: true, default: '' },
    origin: { type: String, trim: true, default: '' },
    vintage: { type: String, trim: true, default: '' },
    date: { type: Date, default: Date.now },
    place: { type: String, trim: true, default: '' },
    taster: { type: String, trim: true, default: '' },
    appearance: { type: String, trim: true, default: '' },
    aromas: { type: [String], default: [] },
    flavors: { type: [String], default: [] },
    pairing: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    photo: { type: String, default: '' },
    score: { type: scoreSchema, default: () => ({}) },
    totalScore: { type: Number, min: 0, max: 100, default: 0 },
    favorite: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pendiente', 'catada', 'archivada'],
      default: 'catada',
    },
  },
  { timestamps: true }
);

cataSchema.pre('save', function calculateTotalScore() {
  const score = this.score || {};
  const values = ['visual', 'aroma', 'taste', 'texture', 'finish'].map((key) => Number(score[key]) || 0);
  const sum = values.reduce((total, value) => total + value, 0);
  this.totalScore = Math.round((sum / 50) * 100);
});

cataSchema.pre('findOneAndUpdate', function calculateTotalScoreForUpdate() {
  const update = this.getUpdate() || {};
  const payload = update.$set || update;
  if (payload.score) {
    const values = ['visual', 'aroma', 'taste', 'texture', 'finish'].map((key) => Number(payload.score[key]) || 0);
    payload.totalScore = Math.round((values.reduce((total, value) => total + value, 0) / 50) * 100);
  }
});

module.exports = mongoose.model('Cata', cataSchema);
