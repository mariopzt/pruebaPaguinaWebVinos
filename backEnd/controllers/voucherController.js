const Voucher = require('../models/Voucher');

const normalizeCode = (code) => (code || '').toString().trim().toUpperCase();

exports.getVouchers = async (req, res, next) => {
  try {
    const query = {};
    if (req.user) query.$or = [{ user: req.user._id }, { user: null }];
    const vouchers = await Voucher.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: vouchers });
  } catch (error) {
    next(error);
  }
};

exports.createVoucher = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    payload.code = normalizeCode(payload.code);
    if (req.user && !payload.user) payload.user = req.user._id;
    const voucher = await Voucher.create(payload);
    res.status(201).json({ success: true, data: voucher });
  } catch (error) {
    next(error);
  }
};

exports.updateVoucher = async (req, res, next) => {
  try {
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
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
