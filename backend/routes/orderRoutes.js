const express = require('express');
const router = express.Router();
const { getMyOrders, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes — only logged-in users can access their own orders
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;
