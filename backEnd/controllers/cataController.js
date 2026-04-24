const Cata = require('../models/Cata');

const parseTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const normalizeBody = (body) => ({
  ...body,
  aromas: parseTags(body.aromas),
  flavors: parseTags(body.flavors),
  score: {
    visual: Number(body.score?.visual) || 0,
    aroma: Number(body.score?.aroma) || 0,
    taste: Number(body.score?.taste) || 0,
    texture: Number(body.score?.texture) || 0,
    finish: Number(body.score?.finish) || 0,
  },
});

exports.getCatas = async (req, res) => {
  try {
    const { q, category, status, favorite } = req.query;
    const filter = {};

    if (category && category !== 'Todas') filter.category = category;
    if (status && status !== 'todas') filter.status = status;
    if (favorite === 'true') filter.favorite = true;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { producer: { $regex: q, $options: 'i' } },
        { origin: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }

    const catas = await Cata.find(filter).sort({ date: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: catas.length,
      data: catas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener catas',
      error: error.message,
    });
  }
};

exports.getCata = async (req, res) => {
  try {
    const cata = await Cata.findById(req.params.id);

    if (!cata) {
      return res.status(404).json({
        success: false,
        message: 'Cata no encontrada',
      });
    }

    return res.status(200).json({ success: true, data: cata });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la cata',
      error: error.message,
    });
  }
};

exports.createCata = async (req, res) => {
  try {
    const cata = await Cata.create(normalizeBody(req.body));

    res.status(201).json({
      success: true,
      message: 'Cata creada correctamente',
      data: cata,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear la cata',
      error: error.message,
    });
  }
};

exports.updateCata = async (req, res) => {
  try {
    const cata = await Cata.findByIdAndUpdate(req.params.id, normalizeBody(req.body), {
      new: true,
      runValidators: true,
    });

    if (!cata) {
      return res.status(404).json({
        success: false,
        message: 'Cata no encontrada',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cata actualizada correctamente',
      data: cata,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error al actualizar la cata',
      error: error.message,
    });
  }
};

exports.deleteCata = async (req, res) => {
  try {
    const cata = await Cata.findById(req.params.id);

    if (!cata) {
      return res.status(404).json({
        success: false,
        message: 'Cata no encontrada',
      });
    }

    await cata.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Cata eliminada correctamente',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la cata',
      error: error.message,
    });
  }
};
