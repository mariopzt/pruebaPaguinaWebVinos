const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

router.route('/')
  .get(optionalAuth, getReviews)
  .post(protect, createReview);

router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
