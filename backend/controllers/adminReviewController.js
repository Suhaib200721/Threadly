const mongoose = require('mongoose');
const Review = require('../models/Review');

// ─────────────────────────────────────────────
// GET /api/admin/reviews
// Returns all reviews in the store with populated product and user details (Admin only)
// ─────────────────────────────────────────────
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('product', 'name price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    res.status(200).json({
      success: true,
      count: totalReviews,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error('Admin getAllReviews error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving reviews.',
    });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/reviews/:id
// Moderates/deletes an inappropriate review (Admin only)
// ─────────────────────────────────────────────
const deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format.',
      });
    }

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review has been successfully deleted by administrator.',
    });
  } catch (error) {
    console.error('Admin deleteReviewAdmin error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting review.',
    });
  }
};

module.exports = {
  getAllReviews,
  deleteReviewAdmin,
};
