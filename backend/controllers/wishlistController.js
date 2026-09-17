const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Category = require('../models/Category');

// ─────────────────────────────────────────────
// GET /api/wishlist (protected)
// ─────────────────────────────────────────────
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const wishlistItems = await Wishlist.find({ user: userId })
      .populate({
        path: 'product',
        populate: { path: 'category', select: 'name' },
      })
      .sort({ createdAt: -1 });

    // Filter out any orphaned entries where product might have been deleted
    const validItems = wishlistItems.filter((item) => item.product !== null);

    res.status(200).json({
      success: true,
      count: validItems.length,
      wishlist: validItems,
    });
  } catch (error) {
    console.error('getWishlist error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error. Failed to retrieve wishlist.',
    });
  }
};

// ─────────────────────────────────────────────
// POST /api/wishlist/:productId (protected)
// ─────────────────────────────────────────────
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    // 2. Verify that the product actually exists in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // 3. Check if already saved
    const existing = await Wishlist.findOne({
      user: userId,
      product: productId,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Product is already in your wishlist.',
        wishlistItem: existing,
      });
    }

    // 4. Create new wishlist document
    const newItem = await Wishlist.create({
      user: userId,
      product: productId,
    });

    // Populate for response
    await newItem.populate({
      path: 'product',
      populate: { path: 'category', select: 'name' },
    });

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist.',
      wishlistItem: newItem,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Product is already in your wishlist.',
      });
    }
    console.error('addToWishlist error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error. Failed to add product to wishlist.',
    });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/wishlist/:productId (protected)
// ─────────────────────────────────────────────
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const deleted = await Wishlist.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your wishlist.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
    });
  } catch (error) {
    console.error('removeFromWishlist error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error. Failed to remove product from wishlist.',
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
