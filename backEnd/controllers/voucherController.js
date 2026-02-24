const Voucher = require('../models/Voucher');

const normalizeCode = (code) => (code || '').toString().trim().toUpperCase();

exports.getVouchers = async (req, res, next) => {
  try {
    // Vales globales: visibles para todas las cuentas.
    const vouchers = await Voucher.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: vouchers });
  } catch (error) {
    next(error);
  }
};

exports.createVoucher = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para crear vales'
      });
    }

    const payload = { ...req.body };
    payload.code = normalizeCode(payload.code);
    // Forzamos vale compartido (no ligado a un usuario concreto).
    payload.user = null;
    const voucher = await Voucher.create(payload);
    res.status(201).json({ success: true, data: voucher });
  } catch (error) {
    next(error);
  }
};

exports.updateVoucher = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para actualizar vales'
      });
    }

    const payload = { ...req.body };
    if (payload.code !== undefined) payload.code = normalizeCode(payload.code);

    const voucher = await Voucher.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Vale no encontrado' });
    }

    res.json({ success: true, data: voucher });
  } catch (error) {
    next(error);
  }
};

exports.deleteVoucher = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para eliminar vales'
      });
    }

    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
