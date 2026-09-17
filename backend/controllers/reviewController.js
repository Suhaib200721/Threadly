const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// ─────────────────────────────────────────────
// GET /api/reviews/product/:productId
// Returns all reviews, rating summary, and current user's review status
// ─────────────────────────────────────────────
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.',
      });
    }

    const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    let totalScore = 0;
    reviews.forEach((r) => {
      totalScore += r.rating;
      if (ratingCounts[r.rating] !== undefined) {
        ratingCounts[r.rating] += 1;
      }
    });

    const averageRating =
      totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 0;

    // Check authenticated user's existing review & purchase status
    let userReview = null;
    let hasPurchased = false;

    if (req.user && req.user.userId) {
      userReview =
        reviews.find((r) => r.user.toString() === req.user.userId) || null;

      try {
        const matchingOrder = await Order.findOne({
          user: req.user.userId,
          paymentStatus: 'Paid',
          'items.productId': productId,
        });
        hasPurchased = !!matchingOrder;
      } catch (err) {
        hasPurchased = false;
      }
    }

    res.status(200).json({
      success: true,
      totalReviews,
      averageRating,
      ratingCounts,
      reviews,
      userReview,
      hasPurchased,
    });
  } catch (error) {
    console.error('getProductReviews error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving product reviews.',
    });
  }
};

// ─────────────────────────────────────────────
// POST /api/reviews
// Creates a new product review (Logged-in users, 1 review per product)
// ─────────────────────────────────────────────
const createReview = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { productId, rating, title, comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to submit a review.',
      });
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Product ID is required.',
      });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars.',
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Review title is required.',
      });
    }

    if (title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Review title cannot exceed 100 characters.',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Review comment is required.',
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review comment cannot exceed 1000 characters.',
      });
    }

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Check for duplicate review by same user
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can edit your existing review.',
      });
    }

    // Fetch user name
    const userDoc = await User.findById(userId);
    const userName = userDoc ? userDoc.name : 'Verified Customer';

    // Check verified purchase
    let isVerifiedPurchase = false;
    try {
      const order = await Order.findOne({
        user: userId,
        paymentStatus: 'Paid',
        'items.productId': productId,
      });
      isVerifiedPurchase = !!order;
    } catch (e) {
      isVerifiedPurchase = false;
    }

    const newReview = await Review.create({
      product: productId,
      user: userId,
      userName,
      rating: Math.round(numRating),
      title: title.trim(),
      comment: comment.trim(),
      isVerifiedPurchase,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review: newReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product.',
      });
    }
    console.error('createReview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error creating review.',
    });
  }
};

// ─────────────────────────────────────────────
// PUT /api/reviews/:id
// Updates an existing review (Owner only)
// ─────────────────────────────────────────────
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { rating, title, comment } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID.',
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    // Ownership check
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this review.',
      });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5 stars.',
        });
      }
      review.rating = Math.round(numRating);
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Review title cannot be empty.',
        });
      }
      if (title.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Review title cannot exceed 100 characters.',
        });
      }
      review.title = title.trim();
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Review comment cannot be empty.',
        });
      }
      if (comment.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Review comment cannot exceed 1000 characters.',
        });
      }
      review.comment = comment.trim();
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully!',
      review,
    });
  } catch (error) {
    console.error('updateReview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating review.',
    });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/reviews/:id
// Deletes a review (Owner only)
// ─────────────────────────────────────────────
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID.',
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    // Ownership check
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review.',
      });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    console.error('deleteReview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting review.',
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};
