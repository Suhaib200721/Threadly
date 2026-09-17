const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Public route to view reviews for a product (uses optionalAuth to detect user's review if logged in)
router.get('/product/:productId', optionalAuth, getProductReviews);

// Protected routes for writing, editing, and deleting own reviews
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
