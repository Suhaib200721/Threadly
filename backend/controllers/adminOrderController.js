const mongoose = require('mongoose');
const Order = require('../models/Order');

const VALID_STATUSES = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

// ─────────────────────────────────────────────
// GET /api/admin/orders
// Returns all orders with summary stats (Admin only)
// ─────────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });

    // Compute summary metrics for dashboard cards
    const summary = {
      total: orders.length,
      paid: orders.filter((o) => o.paymentStatus === 'Paid').length,
      pending: orders.filter((o) =>
        ['Order Placed', 'Confirmed', 'Packed'].includes(o.orderStatus)
      ).length,
      delivered: orders.filter((o) => o.orderStatus === 'Delivered').length,
      cancelled: orders.filter((o) => o.orderStatus === 'Cancelled').length,
    };

    res.status(200).json({
      success: true,
      count: orders.length,
      summary,
      orders,
    });
  } catch (error) {
    console.error('Admin getAllOrders error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving admin orders.',
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/orders/:id
// Returns complete order details by MongoDB _id or orderId (Admin only)
// ─────────────────────────────────────────────
const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID parameter is required.',
      });
    }

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

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Admin getAdminOrderById error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving order details.',
    });
  }
};

// ─────────────────────────────────────────────
// PUT /api/admin/orders/:id/status
// Updates the order status (Admin only)
// ─────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New order status is required.',
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

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

    // Update only the orderStatus field
    order.orderStatus = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status successfully updated to "${status}".`,
      order,
    });
  } catch (error) {
    console.error('Admin updateOrderStatus error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating order status.',
    });
  }
};

module.exports = {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  VALID_STATUSES,
};
