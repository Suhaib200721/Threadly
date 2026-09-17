const mongoose = require('mongoose');
const Product = require('../models/Product');

// ─────────────────────────────────────────────
// GET /api/products  — public
// Returns all active products (populated with category name)
// ─────────────────────────────────────────────
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')   // replace category ID with {_id, name}
      .sort({ createdAt: -1 });       // newest first

    res.status(200).json({ products });
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ message: 'Server error. Could not fetch products.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/products/:id  — public
// Returns a single product by ID
// ─────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    // Validate that the ID is a proper MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findById(req.params.id)
      .populate('category', 'name');

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Get product error:', error.message);
    res.status(500).json({ message: 'Server error. Could not fetch product.' });
  }
};

// ─────────────────────────────────────────────
// POST /api/products  — admin only
// Creates a new product
// ─────────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, sizes, colours, stock, isActive } = req.body;

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required.' });
    }

    if (price === undefined || price < 0) {
      return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
    }

    if (!sizes || sizes.length === 0) {
      return res.status(400).json({ message: 'At least one size is required.' });
    }

    if (!colours || colours.length === 0) {
      return res.status(400).json({ message: 'At least one colour is required.' });
    }

    // Validate each colour has name and image
    for (const colour of colours) {
      if (!colour.name || !colour.image) {
        return res.status(400).json({ message: 'Each colour must have a name and an image URL.' });
      }
    }

    if (stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative.' });
    }

    // Validate that category ID is valid
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Invalid category ID.' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      sizes,
      colours,
      stock: stock || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Populate category before returning
    await product.populate('category', 'name');

    res.status(201).json({
      message: 'Product created successfully.',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ message: 'Server error. Could not create product.' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/products/:id  — admin only
// Updates an existing product
// ─────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const { name, description, price, category, sizes, colours, stock, isActive } = req.body;

    // Only validate fields that are being changed
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative.' });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative.' });
    }

    if (colours && colours.length === 0) {
      return res.status(400).json({ message: 'At least one colour is required.' });
    }

    if (sizes && sizes.length === 0) {
      return res.status(400).json({ message: 'At least one size is required.' });
    }

    // Update only the fields that were sent
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (sizes !== undefined) product.sizes = sizes;
    if (colours !== undefined) product.colours = colours;
    if (stock !== undefined) product.stock = stock;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    await product.populate('category', 'name');

    res.status(200).json({
      message: 'Product updated successfully.',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ message: 'Server error. Could not update product.' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/products/:id  — admin only
// Deletes a product permanently
// ─────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await product.deleteOne();

    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({ message: 'Server error. Could not delete product.' });
  }
};

// Admin: get ALL products including inactive ones
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (error) {
    console.error('Admin get products error:', error.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
};
