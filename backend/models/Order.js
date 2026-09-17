const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false, // Allows flexibility if product was custom/temp
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  colour: {
    type: String,
    required: [true, 'Product colour is required'],
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    required: [true, 'Product size is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  subtotal: {
    type: Number,
    required: [true, 'Item subtotal is required'],
    min: [0, 'Subtotal cannot be negative'],
  },
  customName: {
    type: String,
    trim: true,
    default: '',
  },
});

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Customer full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Customer phone number is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Delivery street address is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Order reference ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order must contain at least one item'],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },
    cartSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
      default: 'Paid',
    },
    orderStatus: {
      type: String,
      enum: [
        'Order Placed',
        'Confirmed',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
      default: 'Order Placed',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
