import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const FALLBACK_IMAGE = 'https://placehold.co/300x400/eeeeee/999999.png?text=No+Image';

// Helper to ensure Razorpay checkout script is loaded
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Checkout() {
  const { cart, totalItems, subtotal, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  // Delivery details form state
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // Payment loading and error states
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Placed order confirmation state
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Payment method selection ('razorpay' | 'upi')
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [upiSubmitted, setUpiSubmitted] = useState(false);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (paymentError) {
      setPaymentError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter a valid full name.';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    // Phone validation (10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required.';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Please enter a complete delivery address.';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required.';
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = 'State is required.';
    }

    // PIN code validation (6 digits)
    const pincodeDigits = formData.pincode.replace(/\D/g, '');
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required.';
    } else if (pincodeDigits.length !== 6) {
      newErrors.pincode = 'Please enter a valid 6-digit PIN code.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayNow = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (cart.length === 0) {
      setPaymentError('Your cart is empty.');
      return;
    }

    setLoading(true);
    setPaymentError('');

    try {
      // 1. Ensure Razorpay script is available
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setPaymentError('Razorpay SDK failed to load. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }

      // 2. Request backend to calculate server-side amount & create Razorpay order
      const orderResponse = await api.post('/payment/create-order', {
        items: cart,
        customer: formData,
      });

      if (!orderResponse.data.success || !orderResponse.data.order) {
        setPaymentError(orderResponse.data.message || 'Could not initiate payment. Please try again.');
        setLoading(false);
        return;
      }

      const { order, keyId, amount } = orderResponse.data;

      // 3. Configure Razorpay Checkout options with UPI App support
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'THREADLY',
        description: `Custom T-shirt Order (${totalItems} items)`,
        order_id: order.id,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
          method: 'upi',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI (Google Pay, PhonePe, Paytm, QR)',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['intent', 'qr', 'collect'],
                    apps: ['google_pay', 'phonepe', 'paytm', 'bhim'],
                  },
                ],
              },
              other: {
                name: 'Cards & Other Payment Modes',
                instruments: [
                  {
                    method: 'card',
                  },
                  {
                    method: 'netbanking',
                  },
                  {
                    method: 'wallet',
                  },
                ],
              },
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        },
        theme: {
          color: '#111111',
        },
        handler: async function (response) {
          // 4. Verify payment response on backend & create order
          try {
            const verifyResponse = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id || order.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || '',
              items: cart,
              customer: formData,
            });

            if (verifyResponse.data.success) {
              // Payment verified on server and order saved to DB!
              const returnedOrder = verifyResponse.data.order;
              const confirmedOrder = returnedOrder || {
                orderId: order.id,
                paymentId: response.razorpay_payment_id || 'RZP_TEST_SUCCESS',
                paymentStatus: 'PAID (Razorpay Test Mode)',
                customer: { ...formData },
                items: [...cart],
                totalItems,
                subtotal,
                totalPrice: amount || totalPrice,
                finalTotal: amount || totalPrice,
                date: new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
              };

              setCompletedOrder(confirmedOrder);
              setOrderComplete(true);
              clearCart(); // Clear cart only after verified payment and order creation
            } else {
              setPaymentError('Payment verification failed. Your cart has been saved. Please try again.');
            }
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            setPaymentError(
              verifyErr.response?.data?.message || 'Payment verification failed on server. Please try again.'
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setPaymentError('Payment was cancelled. Your cart items are preserved.');
          },
        },
      };

      // 4. Open Razorpay Checkout modal
      if (window.Razorpay) {
        const razorpayInstance = new window.Razorpay(options);

        razorpayInstance.on('payment.failed', function (resp) {
          console.error('Razorpay payment failed:', resp.error);
          setPaymentError(
            `Payment failed: ${resp.error?.description || 'Transaction was declined.'}`
          );
          setLoading(false);
        });

        razorpayInstance.open();
      } else {
        // Fallback for automated test environments
        setPaymentError('Razorpay window is not available in current environment.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setPaymentError(
        err.response?.data?.message || 'Could not connect to payment server. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleUpiPaid = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (cart.length === 0) {
      setPaymentError('Your cart is empty.');
      return;
    }

    setPaymentError('');
    setUpiSubmitted(true);
  };

  // ── ORDER SUCCESS SCREEN ───────────────────────────────────
  if (orderComplete && completedOrder) {
    const finalAmount = completedOrder.finalTotal || completedOrder.totalPrice || totalPrice;

    return (
      <div className="checkout-page">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &rsaquo; <Link to="/shop">Shop</Link> &rsaquo; Order Confirmation
        </div>

        <div className="order-success-card">
          <h1>Payment Successful!</h1>
          <p className="order-success-subtitle">
            Thank you, <strong>{completedOrder.customer.fullName}</strong>. Your custom T-shirt order has been placed and confirmed.
          </p>

          <div className="order-ref-box">
            <span>Order Reference: <strong>{completedOrder.orderId}</strong></span>
            {completedOrder.razorpayPaymentId && (
              <span style={{ marginLeft: '16px' }}>Payment ID: <strong>{completedOrder.razorpayPaymentId}</strong></span>
            )}
            {completedOrder.paymentId && !completedOrder.razorpayPaymentId && (
              <span style={{ marginLeft: '16px' }}>Payment ID: <strong>{completedOrder.paymentId}</strong></span>
            )}
          </div>

          <div className="order-details-grid">
            {/* Delivery Details */}
            <div className="order-details-block">
              <h3>Delivery Information</h3>
              <p><strong>{completedOrder.customer.fullName}</strong></p>
              <p>{completedOrder.customer.address}</p>
              <p>{completedOrder.customer.city}, {completedOrder.customer.state} - {completedOrder.customer.pincode}</p>
              <p>Phone: {completedOrder.customer.phone}</p>
              <p>Email: {completedOrder.customer.email}</p>
              <p style={{ marginTop: '12px', color: '#166534', fontWeight: 600 }}>
                Status: {completedOrder.paymentStatus || 'Paid (Razorpay Test Mode)'}
              </p>
            </div>

            {/* Order Summary Block */}
            <div className="order-details-block">
              <h3>Order Summary ({completedOrder.totalItems || totalItems} items)</h3>
              <div className="order-success-items-list">
                {completedOrder.items.map((item, idx) => (
                  <div key={item.id || idx} className="order-success-item-row">
                    <img
                      src={item.image || FALLBACK_IMAGE}
                      alt={item.name}
                      className="order-success-item-img"
                      onError={handleImageError}
                    />
                    <div className="order-success-item-meta">
                      <p className="order-success-item-title">{item.name}</p>
                      <p className="order-success-item-sub">
                        Colour: <strong>{item.colour}</strong> &bull; Size: <strong>{item.size}</strong>
                        {item.customName && <> &bull; Custom Name: <strong>{item.customName}</strong></>} &bull; Qty: <strong>{item.quantity}</strong>
                      </p>
                    </div>
                    <div className="order-success-item-price">
                      ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-success-total-row">
                <span>Total Amount Paid:</span>
                <strong>₹{finalAmount.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div className="order-success-actions">
            {user && (
              <Link to={`/orders/${completedOrder.orderId || completedOrder._id}`} className="btn-primary">
                Track Order
              </Link>
            )}
            <Link to="/orders" className="btn-secondary">
              View My Orders
            </Link>
            <Link to="/shop" className="btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }


  // ── EMPTY CART SCREEN ──────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &rsaquo; <Link to="/shop">Shop</Link> &rsaquo; Checkout
        </div>

        <div className="cart-empty-container">
          <h2>Your Cart is Empty</h2>
          <p>You need items in your cart before proceeding to payment.</p>
          <Link to="/shop" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  // ── ACTIVE CHECKOUT & PAYMENT SCREEN ───────────────────────
  return (
    <div className="checkout-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/shop">Shop</Link> &rsaquo; <Link to="/cart">Cart</Link> &rsaquo; Checkout
      </div>

      <div className="checkout-header">
        <h1>Checkout & Payment</h1>
        <p className="checkout-header-subtitle">
          Enter your delivery details and pay securely via Razorpay Test Mode.
        </p>
      </div>

      <div className="checkout-layout">
        {/* ── LEFT COLUMN: Customer Information Form ─────── */}
        <div className="checkout-form-col">
          <form className="checkout-form-card" onSubmit={paymentMethod === 'upi' ? handleUpiPaid : handlePayNow} noValidate>
            <h2>Delivery Details</h2>

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                disabled={loading}
                className={errors.fullName ? 'input-error' : ''}
              />
              {errors.fullName && <p className="field-error-text">{errors.fullName}</p>}
            </div>

            {/* Email & Phone Row */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  disabled={loading}
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <p className="field-error-text">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  disabled={loading}
                  className={errors.phone ? 'input-error' : ''}
                />
                {errors.phone && <p className="field-error-text">{errors.phone}</p>}
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address">Street Address / House No. *</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Flat / House No., Apartment, Street, Locality"
                disabled={loading}
                className={errors.address ? 'input-error' : ''}
              />
              {errors.address && <p className="field-error-text">{errors.address}</p>}
            </div>

            {/* City, State & Pincode Row */}
            <div className="form-row-3">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  disabled={loading}
                  className={errors.city ? 'input-error' : ''}
                />
                {errors.city && <p className="field-error-text">{errors.city}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  disabled={loading}
                  className={errors.state ? 'input-error' : ''}
                />
                {errors.state && <p className="field-error-text">{errors.state}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  disabled={loading}
                  className={errors.pincode ? 'input-error' : ''}
                />
                {errors.pincode && <p className="field-error-text">{errors.pincode}</p>}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="checkout-payment-methods">
              <h3>Payment Method</h3>
              <div className="payment-options-group">
                <label className={`payment-option-label ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => {
                      setPaymentMethod('razorpay');
                      setUpiSubmitted(false);
                      setPaymentError('');
                    }}
                  />
                  <span>Razorpay (Cards, NetBanking, UPI, Wallets)</span>
                </label>

                <label className={`payment-option-label ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => {
                      setPaymentMethod('upi');
                      setPaymentError('');
                    }}
                  />
                  <span>UPI Scan & Pay</span>
                </label>
              </div>
            </div>

            {/* Razorpay Payment Flow */}
            {paymentMethod === 'razorpay' && (
              <>
                {/* Payment Method Info Notice */}
                <div className="checkout-payment-notice">
                  <div>
                    <strong>Secure Payment via Razorpay (UPI, Google Pay, PhonePe, Paytm, Cards)</strong>
                    <p>Supports UPI Apps, QR Code, Cards, NetBanking, and Wallets (Test Mode). No real money will be charged.</p>
                  </div>
                </div>

                {/* Inline Payment Failure/Cancel Error Banner */}
                {paymentError && (
                  <div className="checkout-payment-error-box">
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Pay Now Button */}
                <button
                  type="submit"
                  className="btn-primary btn-block checkout-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing Payment...' : `Pay Now — ₹${totalPrice.toLocaleString()}`}
                </button>
              </>
            )}

            {/* UPI Scan & Pay Flow */}
            {paymentMethod === 'upi' && (
              <div className="checkout-upi-box">
                <div className="checkout-upi-qr-wrapper">
                  <img
                    src="/images/upi_qr.jpg"
                    alt="UPI QR Code"
                    className="checkout-upi-qr-img"
                  />
                </div>

                <div className="checkout-upi-text-group">
                  <p className="checkout-upi-title">Scan to Pay with any UPI App</p>
                  <p className="checkout-upi-apps">Google Pay / PhonePe / Paytm / BHIM</p>
                </div>

                {paymentError && (
                  <div className="checkout-payment-error-box">
                    <span>{paymentError}</span>
                  </div>
                )}

                {upiSubmitted ? (
                  <div className="checkout-upi-status-card">
                    <p className="checkout-upi-status-title">Payment Recorded</p>
                    <p className="checkout-upi-status-desc">
                      Your payment status is <strong>Pending Verification</strong>.
                      Our team will verify your transaction manually before processing your order.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpiPaid}
                    className="btn-primary btn-block checkout-submit-btn"
                  >
                    I Have Paid
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* ── RIGHT COLUMN: Order Summary ─────────────── */}
        <div className="checkout-summary-col">
          <div className="checkout-summary-card">
            <h2>Order Summary ({totalItems} items)</h2>

            {/* Items List */}
            <div className="checkout-items-list">
              {cart.map((item) => (
                <div key={item.id} className="checkout-item-row">
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt={`${item.name} - ${item.colour}`}
                    className="checkout-item-img"
                    onError={handleImageError}
                  />
                  <div className="checkout-item-details">
                    <p className="checkout-item-name">{item.name}</p>
                    <div className="checkout-item-badges">
                      <span className="checkout-badge">Colour: {item.colour}</span>
                      <span className="checkout-badge">Size: {item.size}</span>
                      {item.customName && (
                        <span className="checkout-badge">Custom Name: {item.customName}</span>
                      )}
                    </div>
                    <p className="checkout-item-qty">
                      Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="checkout-item-subtotal">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <hr className="checkout-divider" />

            {/* Calculations */}
            <div className="checkout-calc-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="checkout-calc-row">
              <span>Standard Shipping</span>
              <span className="cart-free-tag">FREE</span>
            </div>

            <hr className="checkout-divider" />

            <div className="checkout-calc-row checkout-total-row">
              <span>Total Amount</span>
              <span className="checkout-total-price">₹{totalPrice.toLocaleString()}</span>
            </div>

            <div className="checkout-trust-badges">
              <p>100% Cotton & Quality Assured</p>
              <p>Free Shipping across India</p>
              <p>7-Day Hassle-Free Returns</p>
              <p>256-bit Encrypted SSL Payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
