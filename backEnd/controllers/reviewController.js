const Review = require('../models/Review');
const Wine = require('../models/Wine');

const formatReview = (review) => {
  const user = review.user || {};
  const wine = review.wine || {};
  const date = review.createdAt ? review.createdAt.toISOString().split('T')[0] : '';
  const defaultAvatar = `https://api.dicebear.com/8.x/bottts-neutral/png?seed=${encodeURIComponent(user.name || user.email || 'reviewer')}`;

  return {
    id: review._id,
    wineId: wine._id || wine.id || '',
    wineName: wine.name || 'Vino',
    wineType: wine.type || 'Tinto',
    wineImage: wine.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    rating: review.rating,
    comment: review.comment || '',
    date,
    verified: review.verified || false,
    userId: user._id || user.id || '',
    userName: user.name || 'Usuario',
    userAvatar: user.avatar || defaultAvatar
  };
};

const recalcWineRating = async (wineId) => {
  const reviews = await Review.find({ wine: wineId });
  const average =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  await Wine.findByIdAndUpdate(wineId, { rating: average }, { new: false });
};

exports.getReviews = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Necesitas iniciar sesión para ver las valoraciones'
      });
    }

    const filter = {};
    if (req.query.wineId) filter.wine = req.query.wineId;
    if (req.query.rating) filter.rating = Number(req.query.rating);

    const reviews = await Review.find(filter)
      .populate('user', 'name avatar email')
      .populate('wine', 'name type image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews.map(formatReview)
    });
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Necesitas iniciar sesión para publicar una valoración'
      });
    }

    const { wineId, rating, comment } = req.body;
    if (!wineId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Vino, puntuación y comentario son obligatorios'
      });
    }

    const wine = await Wine.findById(wineId);
    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Vino no encontrado'
      });
    }

    const existing = await Review.findOne({ wine: wineId, user: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes dejar una valoración por vino. Edita la existente.'
      });
    }

    const review = await Review.create({
      wine: wineId,
      user: req.user._id,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim(),
      verified: true
    });

    await recalcWineRating(wineId);

    const populated = await Review.findById(review._id)
      .populate('user', 'name avatar email')
      .populate('wine', 'name type image');

    res.status(201).json({
      success: true,
      data: formatReview(populated)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una valoración hecha por este usuario'
      });
    }
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Necesitas iniciar sesión para editar esta valoración'
      });
    }

    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Valoración no encontrada'
      });
    }

    const { rating, comment, verified } = req.body;
    if (rating !== undefined) {
      review.rating = Math.min(5, Math.max(1, Number(rating)));
    }
    if (comment !== undefined) {
      review.comment = comment.trim();
    }
    if (verified !== undefined) {
      review.verified = Boolean(verified);
    }

    await review.save();
    await recalcWineRating(review.wine);

    const populated = await Review.findById(review._id)
      .populate('user', 'name avatar email')
      .populate('wine', 'name type image');

    res.status(200).json({
      success: true,
      data: formatReview(populated)
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Necesitas iniciar sesión para eliminar esta valoración'
      });
    }

    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Valoración no encontrada'
      });
    }

    await recalcWineRating(review.wine);

    res.status(200).json({
      success: true,
      message: 'Valoración eliminada'
    });
  } catch (error) {
    next(error);
  }
};
