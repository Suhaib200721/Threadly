const express = require('express');
const router = express.Router();
const {
  getRazorpayKey,
  createPaymentOrder,
  verifyPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/payment/key
router.get('/key', getRazorpayKey);

// POST /api/payment/create-order — requires customer login
router.post('/create-order', protect, createPaymentOrder);

// POST /api/payment/verify — requires customer login
router.post('/verify', protect, verifyPayment);

module.exports = router;

