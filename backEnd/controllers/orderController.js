const Order = require('../models/Order');

exports.getOrders = async (req, res, next) => {
  try {
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
      }));
      // asegurar que mongoose detecte cambio
      order.markModified('items');
    }

    // Recalcular completado
    const items = order.items || [];
    const allCompleted = items.length > 0 && items.every((it) => !!it.completed);
    order.completed = allCompleted;
    order.status = allCompleted ? 'completed' : 'pending';

    const saved = await order.save();
    console.log('[updateOrder] Guardado:', JSON.stringify(saved, null, 2));
    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('[updateOrder] Error:', error);
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

