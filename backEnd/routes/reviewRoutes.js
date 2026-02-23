const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

router.route('/')
  .get(optionalAuth, getReviews)
  .post(optionalAuth, createReview);

router.route('/:id')
  .put(optionalAuth, updateReview)
  .delete(optionalAuth, deleteReview);

module.exports = router;
