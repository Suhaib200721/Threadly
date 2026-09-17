const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAdminUsers,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes here strictly require JWT authentication and admin role
router.use(protect, adminOnly);

// GET /api/admin/stats — dashboard overview metrics
router.get('/stats', getAdminStats);

// GET /api/admin/users — registered user accounts listing
router.get('/users', getAdminUsers);

module.exports = router;
