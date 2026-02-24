const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    group: { type: String, default: 'hoy' }, // hoy, ayer, semana, terminadas
    date: { type: String },
    dateValue: { type: String },
    status: { type: String, default: 'pending' }, // pending, completed
    priority: { type: String, default: 'medium' }, // low, medium, high
    color: { type: String, default: 'blue' },
    avatars: { type: [String], default: [] },
    extraCount: { type: Number, default: 0 },
    metadata: { type: Object, default: {} },
    reminderForDate: { type: String, default: null }, // YYYY-MM-DD de la última fecha notificada
    reminderSentAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Task', taskSchema);

