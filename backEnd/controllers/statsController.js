const WineStats = require('../models/WineStats');
const Wine = require('../models/Wine');
const Review = require('../models/Review');

// @desc    Obtener estadísticas actuales
// @route   GET /api/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    let stats = await WineStats.findOne();
    
    // Si no existen estadísticas, crear por primera vez
    if (!stats) {
      stats = await WineStats.create({
        sales: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 },
        losses: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 }
      });
    }

    const trends = stats.calculateTrends();

    res.status(200).json({
      success: true,
      data: {
        sales: stats.sales,
        losses: stats.losses,
        trends
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
    error: error.message
  });
  }
};

const computeGrowthLabel = (current, previous) => {
  if (previous === 0 && current === 0) return '0.0%';
  if (previous === 0) return '+100.0%';
  const diff = current - previous;
  const percent = ((diff / previous) * 100).toFixed(1);
  return `${diff >= 0 ? '+' : ''}${percent}%`;
};

const getTopWines = async (req, res, next) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const reviews = await Review.find().lean();
    const reviewStats = {};

    reviews.forEach((review) => {
      const wineId = review.wine?.toString();
      if (!wineId) return;

      const stats = reviewStats[wineId] || { total: 0, ratingSum: 0, lastWeek: 0, prevWeek: 0 };
      stats.total += 1;
      stats.ratingSum += Number(review.rating) || 0;

      const createdAt = review.createdAt ? new Date(review.createdAt) : null;
      if (createdAt) {
        if (createdAt >= weekAgo) {
          stats.lastWeek += 1;
        } else if (createdAt >= twoWeeksAgo) {
          stats.prevWeek += 1;
        }
      }

      reviewStats[wineId] = stats;
    });

    const wines = await Wine.find({}).lean();
    const userId = req.user?._id?.toString();

    const topWines = wines
      .map((wine) => {
        const wineId = wine._id.toString();
        const stats = reviewStats[wineId] || { total: 0, ratingSum: 0, lastWeek: 0, prevWeek: 0 };
        const likesCount = wine.likes?.count || 0;
        const avgRating = stats.total > 0
          ? +(stats.ratingSum / stats.total).toFixed(1)
          : +(wine.rating || 0);
        const growth = computeGrowthLabel(stats.lastWeek, stats.prevWeek);
        const liked = userId
          ? (wine.likes?.users || []).some((id) => id?.toString() === userId)
          : false;
        const score = likesCount * 2 + stats.total * 1.3 + avgRating * 4;

        return {
          wine,
          likes: likesCount,
          growth,
          rating: avgRating,
          reviews: stats.total,
          liked,
          score
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    res.status(200).json({
      success: true,
      data: topWines
    });
  } catch (error) {
    next(error);
  }
};

exports.getTopWines = getTopWines;

// @desc    Registrar venta de vino
// @route   POST /api/stats/sale
// @access  Private
exports.registerSale = async (req, res) => {
  try {
    const { wineId, quantity } = req.body;

    if (!wineId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos'
      });
    }

    // Obtener el vino para saber su tipo
    const wine = await Wine.findById(wineId);
    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Vino no encontrado'
      });
    }

    // Obtener o crear estadísticas
    let stats = await WineStats.findOne();
    if (!stats) {
      stats = await WineStats.create({
        sales: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 },
        losses: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 }
      });
    }

    // Actualizar estadísticas
    stats.sales.total += quantity;
    const wineType = wine.type.toLowerCase();
    if (stats.sales[wineType] !== undefined) {
      stats.sales[wineType] += quantity;
    }
    stats.lastUpdate = Date.now();

    await stats.save();

    res.status(200).json({
      success: true,
      message: 'Venta registrada',
      data: {
        sales: stats.sales,
        trends: stats.calculateTrends()
      }
    });
  } catch (error) {
    console.error('Error al registrar venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar venta',
      error: error.message
    });
  }
};

// @desc    Registrar pérdida de vino (roto, jefe, etc.)
// @route   POST /api/stats/loss
// @access  Private
exports.registerLoss = async (req, res) => {
  try {
    const { wineId, quantity, reason } = req.body;

    if (!wineId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos'
      });
    }

    // Obtener el vino para saber su tipo
    const wine = await Wine.findById(wineId);
    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Vino no encontrado'
      });
    }

    // Obtener o crear estadísticas
    let stats = await WineStats.findOne();
    if (!stats) {
      stats = await WineStats.create({
        sales: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 },
        losses: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 }
      });
    }

    // Actualizar pérdidas
    stats.losses.total += quantity;
    const wineType = wine.type.toLowerCase();
    if (stats.losses[wineType] !== undefined) {
      stats.losses[wineType] += quantity;
    }
    stats.lastUpdate = Date.now();

    await stats.save();

    res.status(200).json({
      success: true,
      message: `Pérdida registrada: ${reason || 'Sin motivo especificado'}`,
      data: {
        losses: stats.losses,
        trends: stats.calculateTrends()
      }
    });
  } catch (error) {
    console.error('Error al registrar pérdida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar pérdida',
      error: error.message
    });
  }
};

// @desc    Resetear estadísticas
// @route   DELETE /api/stats/reset
// @access  Private (solo admin)
exports.resetStats = async (req, res) => {
  try {
    const stats = await WineStats.findOne();
    
    if (stats) {
      // Guardar en historial antes de resetear
      stats.history.push({
        date: Date.now(),
        sales: { ...stats.sales },
        losses: { ...stats.losses }
      });

      // Resetear contadores
      stats.sales = { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 };
      stats.losses = { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 };
      stats.lastUpdate = Date.now();

      await stats.save();
    }

    res.status(200).json({
      success: true,
      message: 'Estadísticas reseteadas (guardadas en historial)'
    });
  } catch (error) {
    console.error('Error al resetear estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear estadísticas',
      error: error.message
    });
  }
};

