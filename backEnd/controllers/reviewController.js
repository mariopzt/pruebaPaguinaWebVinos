const Review = require('../models/Review');
const Wine = require('../models/Wine');
const crypto = require('crypto');
const mongoose = require('mongoose');

const getGuestSurrogateUserId = (guestId) => {
  const hash24 = crypto.createHash('md5').update(String(guestId)).digest('hex').slice(0, 24);
  return new mongoose.Types.ObjectId(hash24);
};

const getActorFromRequest = (req) => {
  if (req.user?._id) {
    return {
      type: 'user',
      userId: req.user._id,
      name: req.user.name || 'Usuario',
      avatar: req.user.avatar || ''
    };
  }

  const guestId = (req.body?.guestId || req.query?.guestId || '').toString().trim();
  if (!guestId) return null;

  return {
    type: 'guest',
    guestId,
    name: (req.body?.guestName || req.query?.guestName || 'Invitado').toString().trim() || 'Invitado',
    avatar: (req.body?.guestAvatar || req.query?.guestAvatar || '').toString().trim()
  };
};

const formatReview = (review) => {
  const user = review.user || {};
  const wine = review.wine || {};
  const date = review.createdAt ? review.createdAt.toISOString().split('T')[0] : '';
  const displayName = user.name || review.guestName || 'Usuario';

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
    userId: user._id || user.id || review.guestId || '',
    userEmail: user.email || '',
    userName: displayName,
    userAvatar: user.avatar || review.guestAvatar || ''
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
    const actor = getActorFromRequest(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Necesitas identificarte para publicar una valoracion'
      });
    }

    const { wineId, rating, comment } = req.body;
    if (!wineId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Vino, puntuacion y comentario son obligatorios'
      });
    }

    const wine = await Wine.findById(wineId);
    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Vino no encontrado'
      });
    }

    const existingFilter =
      actor.type === 'user'
        ? { wine: wineId, user: actor.userId }
        : { wine: wineId, guestId: actor.guestId };

    const existing = await Review.findOne(existingFilter);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes dejar una valoracion por vino. Edita la existente.'
      });
    }

    const reviewPayload = {
      wine: wineId,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim(),
      verified: actor.type === 'user'
    };

    if (actor.type === 'user') {
      reviewPayload.user = actor.userId;
    } else {
      // Guardamos un ObjectId estable para invitados para mantener unicidad por vino+invitado.
      reviewPayload.user = getGuestSurrogateUserId(actor.guestId);
      reviewPayload.guestId = actor.guestId;
      reviewPayload.guestName = actor.name;
      reviewPayload.guestAvatar = actor.avatar;
    }

    const review = await Review.create(reviewPayload);

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
        message: 'Ya existe una valoracion hecha por este usuario'
      });
    }
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const actor = getActorFromRequest(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Necesitas identificarte para editar esta valoracion'
      });
    }

    const reviewFilter =
      actor.type === 'user'
        ? { _id: req.params.id, user: actor.userId }
        : { _id: req.params.id, guestId: actor.guestId };

    const review = await Review.findOne(reviewFilter);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Valoracion no encontrada'
      });
    }

    const { rating, comment, verified } = req.body;
    if (rating !== undefined) {
      review.rating = Math.min(5, Math.max(1, Number(rating)));
    }
    if (comment !== undefined) {
      review.comment = comment.trim();
    }
    if (verified !== undefined && actor.type === 'user') {
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
    const actor = getActorFromRequest(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Necesitas identificarte para eliminar esta valoracion'
      });
    }

    const deleteFilter =
      actor.type === 'user'
        ? { _id: req.params.id, user: actor.userId }
        : { _id: req.params.id, guestId: actor.guestId };

    const review = await Review.findOneAndDelete(deleteFilter);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Valoracion no encontrada'
      });
    }

    await recalcWineRating(review.wine);

    res.status(200).json({
      success: true,
      message: 'Valoracion eliminada'
    });
  } catch (error) {
    next(error);
  }
};
