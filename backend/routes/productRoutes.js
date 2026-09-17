const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
} = require('../controllers/productController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllProducts);
router.get('/admin/all', protect, adminOnly, getAllProductsAdmin); // admin sees inactive too
router.get('/:id', getProductById);

// Admin-only routes
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
