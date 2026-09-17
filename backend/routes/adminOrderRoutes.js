const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
} = require('../controllers/adminOrderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes here require valid JWT authentication and admin role
router.use(protect, adminOnly);

// GET /api/admin/orders — list all orders with summary counts
router.get('/', getAllOrders);

// GET /api/admin/orders/:id — single order details for admin
router.get('/:id', getAdminOrderById);

// PUT /api/admin/orders/:id/status — update order status
router.put('/:id/status', updateOrderStatus);

module.exports = router;
