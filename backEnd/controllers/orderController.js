const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper para crear notificaciones para todos los usuarios excepto uno
const notifyAllUsersExcept = async (excludeUserId, notificationData) => {
  try {
    const users = await User.find({ _id: { $ne: excludeUserId } }).select('_id').lean();
    const notifications = users.map(user => ({
      ...notificationData,
      user: user._id,
      unread: true,
      createdAt: new Date()
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`[Notificaciones] Creadas ${notifications.length} notificaciones`);
    }
  } catch (error) {
    console.error('[Notificaciones] Error al crear:', error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para acceder a pedidos'
      });
    }

    const query = {};
    if (req.user) query.$or = [{ user: req.user._id }, { user: null }];
    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para crear pedidos'
      });
    }

    const payload = { ...req.body };
    const items = Array.isArray(payload.items) ? payload.items : [];
    const allCompleted = items.length > 0 && items.every(it => !!it.completed);
    payload.completed = allCompleted;
    payload.status = allCompleted ? 'completed' : 'pending';
    if (req.user && !payload.user) payload.user = req.user._id;
    const order = await Order.create(payload);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para actualizar pedidos'
      });
    }

    console.log('[updateOrder] id:', req.params.id);
    console.log('[updateOrder] body:', JSON.stringify(req.body, null, 2));
    
    const payload = { ...req.body };
    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log('[updateOrder] Pedido no encontrado');
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    // Campos simples
    if (payload.orderNumber !== undefined) order.orderNumber = payload.orderNumber;
    if (payload.supplier !== undefined) order.supplier = payload.supplier;
    if (payload.orderDate !== undefined) order.orderDate = payload.orderDate;
    if (payload.expectedDate !== undefined) order.expectedDate = payload.expectedDate;
    if (payload.status !== undefined) order.status = payload.status;

    // Items
    if (Array.isArray(payload.items)) {
      order.items = payload.items.map((it) => ({
        _id: it._id, // conservar _id si viene
        name: it.name,
        quantity: it.quantity,
        completed: !!it.completed,
        completedBy: it.completedBy || null, // guardar quién lo completó
      }));
      // asegurar que mongoose detecte cambio
      order.markModified('items');
    }

    // Recalcular completado
    const items = order.items || [];
    const allCompleted = items.length > 0 && items.every((it) => !!it.completed);
    const wasCompleted = order.completed;
    order.completed = allCompleted;
    order.status = allCompleted ? 'completed' : 'pending';

    const saved = await order.save();
    console.log('[updateOrder] Guardado:', JSON.stringify(saved, null, 2));

    // Si el pedido acaba de completarse, notificar a todos los demás usuarios
    if (allCompleted && !wasCompleted && req.user) {
      await notifyAllUsersExcept(req.user._id, {
        type: 'pedido-completado',
        icon: 'FiCheckCircle',
        title: 'Pedido completado',
        message: `**${req.user.name || 'Un usuario'}** ha completado el pedido **#${saved.orderNumber}** de ${saved.supplier}`,
        actions: ['Ver pedidos'],
        metadata: { orderId: saved._id }
      });
    }

    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('[updateOrder] Error:', error);
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para eliminar pedidos'
      });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

