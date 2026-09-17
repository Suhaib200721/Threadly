const mongoose = require('mongoose');

// Each colour has a name and its own image URL
const colourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Colour name is required'],
    trim: true,
  },
  image: {
    type: String,
    required: [true, 'Colour image URL is required'],
  },
}, { _id: false }); // no need for separate _id on each colour

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Reference to Category model
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },

    // Available sizes for this product
    sizes: {
      type: [String],
      enum: ['S', 'M', 'L', 'XL', 'XXL'],
      required: true,
    },

    // Each colour entry has a name and a unique image
    colours: {
      type: [colourSchema],
      required: true,
    },

    // Total available stock
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },

    // Active flag — admin can hide a product without deleting it
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
