const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');

// ─────────────────────────────────────────────
// GET /api/admin/stats
// Returns summary counts for the admin dashboard (Admin only)
// ─────────────────────────────────────────────
const getAdminStats = async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalUsers, totalReviews, orders] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        Review.countDocuments(),
        Order.find({}, 'finalTotal paymentStatus orderStatus'),
      ]);

    // Calculate total revenue from paid orders
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + (o.finalTotal || 0), 0);

    // Count pending / processing orders
    const pendingOrders = orders.filter((o) =>
      ['Order Placed', 'Confirmed', 'Packed'].includes(o.orderStatus)
    ).length;

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalReviews,
        totalRevenue,
        pendingOrders,
      },
    });
  } catch (error) {
    console.error('Admin getAdminStats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving admin statistics.',
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/users
// Returns all registered users without passwords (Admin only)
// ─────────────────────────────────────────────
const getAdminUsers = async (req, res) => {
  try {
    // Exclude password field completely
    const users = await User.find({}, '-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Admin getAdminUsers error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving registered users.',
    });
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
};
