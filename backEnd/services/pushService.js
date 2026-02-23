const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

let vapidConfigured = false;

const hasPushConfig = () =>
  Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );

const ensureVapidConfigured = () => {
  if (vapidConfigured || !hasPushConfig()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
};

const cleanMessage = (message = '') =>
  String(message).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

const buildPayload = (notificationDoc) => {
  const id = String(notificationDoc._id || notificationDoc.id || '');
  return {
    title: notificationDoc.title || 'Nueva notificacion',
    body: cleanMessage(notificationDoc.message || 'Tienes una nueva notificacion'),
    tag: id ? `notif-${id}` : `notif-${Date.now()}`,
    data: {
      notificationId: id,
      wineId: notificationDoc.wineId ? String(notificationDoc.wineId) : null,
      view: 'ayuda',
      url: '/?view=ayuda',
    },
  };
};

const removeSubscriptionByEndpoint = async (endpoint) => {
  if (!endpoint) return;
  try {
    await PushSubscription.deleteOne({ endpoint });
  } catch (error) {
    console.warn('No se pudo eliminar suscripcion push invalida:', error.message);
  }
};

const sendNotificationToUserSubscriptions = async (notificationDoc) => {
  if (!hasPushConfig()) return;
  ensureVapidConfigured();

  const userId = notificationDoc?.user ? String(notificationDoc.user) : null;
  if (!userId) return;

  const subscriptions = await PushSubscription.find({ user: userId }).lean();
  if (!subscriptions.length) return;

  const payload = JSON.stringify(buildPayload(notificationDoc));

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime ?? null,
            keys: {
              p256dh: subscription.keys?.p256dh,
              auth: subscription.keys?.auth,
            },
          },
          payload
        );
      } catch (error) {
        const status = error?.statusCode;
        if (status === 404 || status === 410) {
          await removeSubscriptionByEndpoint(subscription.endpoint);
          return;
        }
        console.warn('Error enviando push notification:', error.message);
      }
    })
  );
};

const queuePushForNotifications = async (notifications = []) => {
  if (!Array.isArray(notifications) || !notifications.length) return;

  const docs = notifications.filter(Boolean);
  if (!docs.length) return;

  await Promise.all(docs.map((doc) => sendNotificationToUserSubscriptions(doc)));
};

module.exports = {
  hasPushConfig,
  queuePushForNotifications,
};
