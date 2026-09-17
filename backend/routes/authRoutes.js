const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register — create a new customer account
router.post('/register', register);

// POST /api/auth/login — login with email and password
router.post('/login', login);

// GET /api/auth/me — get the currently logged-in user (protected)
router.get('/me', protect, getMe);

module.exports = router;
