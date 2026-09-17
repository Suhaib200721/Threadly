const express = require('express');
const router = express.Router();

const {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

// All profile and password endpoints are strictly protected by JWT auth
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changeUserPassword);

module.exports = router;
