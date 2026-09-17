const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  deleteReviewAdmin,
} = require('../controllers/adminReviewController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(protect, adminOnly);

// GET /api/admin/reviews — all customer reviews across catalog
router.get('/', getAllReviews);

// DELETE /api/admin/reviews/:id — remove review
router.delete('/:id', deleteReviewAdmin);

module.exports = router;
