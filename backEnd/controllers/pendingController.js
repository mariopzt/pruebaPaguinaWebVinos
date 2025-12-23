const crypto = require('crypto');
const PendingUser = require('../models/PendingUser');
const User = require('../models/User');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Crear usuario pendiente y devolver link de activación
exports.createPending = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const emailNorm = email?.toLowerCase().trim();
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Nombre y email son requeridos' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 días

    const pending = await PendingUser.findOneAndUpdate(
      { email: emailNorm },
      { name, email: emailNorm, token, expiresAt },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const activationLink = `${FRONTEND_URL}/activate?token=${token}`;

    res.status(201).json({
      success: true,
      data: {
        id: pending._id,
        email: pending.email,
        name: pending.name,
        token: pending.token,
        expiresAt: pending.expiresAt,
        activationLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener pendiente por token (para validar link)
exports.getPendingByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const pending = await PendingUser.findOne({ token, expiresAt: { $gt: new Date() } }).lean();
    if (!pending) {
      return res.status(404).json({ success: false, message: 'Token inválido o expirado' });
    }
    res.json({ success: true, data: { email: pending.email, name: pending.name } });
  } catch (error) {
    next(error);
  }
};

// Consumir token y crear usuario definitivo
exports.activatePending = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Contraseña mínima 6 caracteres' });
    }

    const pending = await PendingUser.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!pending) {
      return res.status(404).json({ success: false, message: 'Token inválido o expirado' });
    }

    // Si ya existe usuario con ese email, solo marcar verificado
    let user = await User.findOne({ email: pending.email }).select('+password');
    if (user) {
      user.name = pending.name || user.name;
      user.isVerified = true;
      user.password = password; // se re-encriptará en pre-save
      await user.save();
    } else {
      user = await User.create({
        name: pending.name,
        email: pending.email,
        password,
        isVerified: true,
        role: 'user',
      });
    }

    await PendingUser.deleteOne({ _id: pending._id });

    res.json({
      success: true,
      message: 'Cuenta activada correctamente',
      data: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
};

