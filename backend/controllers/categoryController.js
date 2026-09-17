const Category = require('../models/Category');

// ─────────────────────────────────────────────
// GET /api/categories  — public
// ─────────────────────────────────────────────
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ message: 'Server error. Could not fetch categories.' });
  }
};

// ─────────────────────────────────────────────
// POST /api/categories  — admin only
// ─────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    // Check for duplicate
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'A category with this name already exists.' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    res.status(201).json({
      message: 'Category created successfully.',
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A category with this name already exists.' });
    }
    console.error('Create category error:', error.message);
    res.status(500).json({ message: 'Server error. Could not create category.' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/categories/:id  — admin only
// ─────────────────────────────────────────────
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const { name, description } = req.body;

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();

    await category.save();

    res.status(200).json({
      message: 'Category updated successfully.',
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A category with this name already exists.' });
    }
    console.error('Update category error:', error.message);
    res.status(500).json({ message: 'Server error. Could not update category.' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/categories/:id  — admin only
// ─────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    await category.deleteOne();

    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error.message);
    res.status(500).json({ message: 'Server error. Could not delete category.' });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
