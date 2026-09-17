const mongoose = require('mongoose');
const Order = require('../models/Order');

// ─────────────────────────────────────────────
// GET /api/orders
// Returns all orders belonging to the logged-in customer (newest first)
// ─────────────────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view orders.',
      });
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving orders.',
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/orders/:id
// Returns detailed info for a single order by MongoDB _id or custom orderId
// ─────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required.',
      });
    }

    // Search by ObjectId if valid format, otherwise search by orderId string
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }

    if (!order) {
      order = await Order.findOne({ orderId: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Security check: verify ownership
    const isOwner = order.user && order.user.toString() === userId;
    const isAdmin = role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order.',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving order details.',
    });
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
};
