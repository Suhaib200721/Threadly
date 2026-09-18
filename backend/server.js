// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminReviewRoutes = require('./routes/adminReviewRoutes');
const userRoutes = require('./routes/userRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve product images statically
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Root route
app.get('/', (req, res) => {
  res.send('THREADLY Backend API is running');
});

// API test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'THREADLY API is working'
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User profile & account routes
app.use('/api/users', userRoutes);

// Wishlist routes
app.use('/api/wishlist', wishlistRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);

// Payment routes
app.use('/api/payment', paymentRoutes);

// Customer order routes
app.use('/api/orders', orderRoutes);

// Admin order routes
app.use('/api/admin/orders', adminOrderRoutes);

// Customer review routes
app.use('/api/reviews', reviewRoutes);

// Admin review routes
app.use('/api/admin/reviews', adminReviewRoutes);

// General admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`THREADLY server is running on port ${PORT}`);
});