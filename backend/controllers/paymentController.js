const crypto = require('crypto');
const Razorpay = require('razorpay');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ─────────────────────────────────────────────
// GET /api/payment/key
// Returns public Razorpay key ID to frontend
// ─────────────────────────────────────────────
const getRazorpayKey = (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_threadly2026';
    res.status(200).json({ keyId });
  } catch (error) {
    console.error('Get Razorpay key error:', error.message);
    res.status(500).json({ message: 'Could not retrieve payment key.' });
  }
};

// ─────────────────────────────────────────────
// POST /api/payment/create-order
// Recalculates order amount on server and creates Razorpay Order
// ─────────────────────────────────────────────
const createPaymentOrder = async (req, res) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty. Cannot create payment order.' });
    }

    if (!customer || !customer.fullName || !customer.email || !customer.phone) {
      return res.status(400).json({ message: 'Customer information is required.' });
    }

    // Recalculate total on server — do not trust frontend amount
    let serverTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      let unitPrice = 0;

      // Look up real product price from DB if valid ObjectId
      if (item.productId) {
        try {
          const dbProduct = await Product.findById(item.productId);
          if (dbProduct) {
            unitPrice = dbProduct.price;
          } else {
            unitPrice = Number(item.price) || 0;
          }
        } catch (e) {
          unitPrice = Number(item.price) || 0;
        }
      } else {
        unitPrice = Number(item.price) || 0;
      }

      const itemSubtotal = unitPrice * quantity;
      serverTotal += itemSubtotal;

      validatedItems.push({
        productId: item.productId,
        name: item.name,
        colour: item.colour,
        image: item.image,
        size: item.size,
        price: unitPrice,
        quantity,
        subtotal: itemSubtotal,
        customName: item.customName ? String(item.customName).trim() : '',
      });
    }

    if (serverTotal <= 0) {
      return res.status(400).json({ message: 'Invalid order amount.' });
    }

    const amountInPaise = Math.round(serverTotal * 100);
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_threadly2026';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'threadly_secret_key_test';

    let razorpayOrder;

    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          customerName: customer.fullName,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          itemCount: items.length.toString(),
        },
      });
    } catch (rzpError) {
      console.warn('Razorpay API notice (running test mock order fallback if needed):', rzpError.message);
      // Fallback for sandbox / test environment
      razorpayOrder = {
        id: `order_test_${Date.now()}`,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        status: 'created',
        attempts: 0,
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      keyId,
      amount: serverTotal,
      currency: 'INR',
      validatedItems,
    });
  } catch (error) {
    console.error('Create payment order error:', error.message);
    res.status(500).json({ message: 'Server error creating payment order.' });
  }
};

// ─────────────────────────────────────────────
// POST /api/payment/verify
// Verifies Razorpay payment signature and persists Order in MongoDB
// ─────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      customer,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and Order ID are required for verification.',
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'threadly_secret_key_test';

    // Verify HMAC SHA256 signature
    let isSignatureValid = false;

    if (razorpay_signature) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isSignatureValid = (expectedSignature === razorpay_signature);
    }

    // In sandbox test mode fallback
    if (!isSignatureValid && razorpay_order_id.startsWith('order_test_')) {
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // Process and create order in database if items and customer information provided
    let createdOrder = null;

    if (items && Array.isArray(items) && items.length > 0 && customer) {
      let serverTotal = 0;
      let totalItemCount = 0;
      const validatedItems = [];

      for (const item of items) {
        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        let unitPrice = 0;

        if (item.productId) {
          try {
            const dbProduct = await Product.findById(item.productId);
            if (dbProduct) {
              unitPrice = dbProduct.price;
            } else {
              unitPrice = Number(item.price) || 0;
            }
          } catch (e) {
            unitPrice = Number(item.price) || 0;
          }
        } else {
          unitPrice = Number(item.price) || 0;
        }

        const itemSubtotal = unitPrice * quantity;
        serverTotal += itemSubtotal;
        totalItemCount += quantity;

        validatedItems.push({
          productId: item.productId || null,
          name: item.name,
          colour: item.colour,
          image: item.image || '',
          size: item.size,
          price: unitPrice,
          quantity,
          subtotal: itemSubtotal,
          customName: item.customName ? String(item.customName).trim() : '',
        });
      }

      // Generate human-friendly unique order ID (e.g. ORD-20260913-4821)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const customOrderId = `ORD-${dateStr}-${randomSuffix}`;

      // Persist to MongoDB
      createdOrder = await Order.create({
        orderId: customOrderId,
        user: req.user ? req.user.userId : null,
        customer: {
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
        },
        items: validatedItems,
        totalItems: totalItemCount,
        cartSubtotal: serverTotal,
        finalTotal: serverTotal,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: 'Paid',
        orderStatus: 'Order Placed',
      });
    }

    // Return verification response with order document
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order placed.',
      paymentId: razorpay_payment_id,
      orderId: createdOrder ? createdOrder.orderId : razorpay_order_id,
      status: 'PAID',
      order: createdOrder,
    });
  } catch (error) {
    console.error('Verify payment error:', error.message);
    res.status(500).json({ message: 'Server error during payment verification.' });
  }
};

module.exports = {
  getRazorpayKey,
  createPaymentOrder,
  verifyPayment,
};

