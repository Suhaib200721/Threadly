// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
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
app.use(cors());           // Allow requests from the frontend
app.use(express.json());   // Parse JSON request bodies

// Test route - used to verify the API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'THREADLY API is working' });
});

// Auth routes (register, login, me)
app.use('/api/auth', authRoutes);

// User profile & account routes
app.use('/api/users', userRoutes);

// Wishlist routes (Saved products)
app.use('/api/wishlist', wishlistRoutes);

// Product routes (CRUD — admin protected)
app.use('/api/products', productRoutes);

// Category routes (CRUD — admin protected)
app.use('/api/categories', categoryRoutes);

// Payment routes (Razorpay orders & verification)
app.use('/api/payment', paymentRoutes);

// Order routes (Customer order history & tracking)
app.use('/api/orders', orderRoutes);

// Admin order routes (Admin order management & status updates)
app.use('/api/admin/orders', adminOrderRoutes);

// Review routes (Customer reviews & ratings)
app.use('/api/reviews', reviewRoutes);

// Admin review routes (Admin review moderation)
app.use('/api/admin/reviews', adminReviewRoutes);




// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`THREADLY server is running on port ${PORT}`);
});
