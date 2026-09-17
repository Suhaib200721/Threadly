const express = require('express');
const router = express.Router();
const {
  getRazorpayKey,
  createPaymentOrder,
  verifyPayment,
} = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/authMiddleware');

// GET /api/payment/key
router.get('/key', getRazorpayKey);

// POST /api/payment/create-order
router.post('/create-order', optionalAuth, createPaymentOrder);

// POST /api/payment/verify
router.post('/verify', optionalAuth, verifyPayment);

module.exports = router;

