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

// Root route — simple HTML status page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>THREADLY Backend API</title>
  <style>
    body { font-family: monospace; padding: 40px; background: #fff; color: #111; }
    h1 { font-size: 1.6rem; margin-bottom: 8px; }
    p { margin: 4px 0; }
    ul { margin-top: 8px; padding-left: 20px; line-height: 1.9; }
    hr { margin: 20px 0; border: none; border-top: 1px solid #ccc; }
  </style>
</head>
<body>
  <h1>THREADLY Backend API</h1>
  <hr />
  <p><strong>Status:</strong> Running</p>
  <p><strong>Server:</strong> Express.js</p>
  <p><strong>Database:</strong> MongoDB</p>
  <hr />
  <p><strong>Available API Routes:</strong></p>
  <ul>
    <li>/api/auth</li>
    <li>/api/products</li>
    <li>/api/categories</li>
    <li>/api/payment</li>
    <li>/api/orders</li>
    <li>/api/admin/orders</li>
    <li>/api/reviews</li>
    <li>/api/admin/reviews</li>
    <li>/api/users</li>
    <li>/api/wishlist</li>
  </ul>
  <hr />
  <p>Backend API is running successfully.</p>
</body>
</html>
  `);
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