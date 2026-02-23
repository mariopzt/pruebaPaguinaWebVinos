const PushSubscription = require('../models/PushSubscription');
const { hasPushConfig } = require('../services/pushService');

const isValidSubscription = (subscription) =>
  Boolean(
    subscription &&
      subscription.endpoint &&
      subscription.keys &&
      subscription.keys.p256dh &&
      subscription.keys.auth
  );

exports.getPublicKey = async (req, res) => {
  return res.json({
    success: true,
    data: {
      configured: hasPushConfig(),
      publicKey: process.env.VAPID_PUBLIC_KEY || null,
    },
  });
};

exports.subscribe = async (req, res, next) => {
  try {
    if (!hasPushConfig()) {
      return res.status(503).json({
        success: false,
        message: 'Push notifications no configuradas en el servidor',
      });
    }

    const { subscription, guestId } = req.body || {};

    if (!isValidSubscription(subscription)) {
      return res.status(400).json({
        success: false,
        message: 'Suscripcion push invalida',
      });
    }

    const userId = req.user?._id || null;
    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere user autenticado o guestId',
      });
    }

    const now = new Date();
    const update = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime ?? null,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userAgent: req.headers['user-agent'] || '',
      updatedAt: now,
      user: userId || null,
      guestId: userId ? null : String(guestId).trim(),
      createdAt: now,
    };

    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      data: {
        id: saved._id,
        endpoint: saved.endpoint,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'endpoint es obligatorio',
      });
    }

    await PushSubscription.deleteOne({ endpoint });

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};
