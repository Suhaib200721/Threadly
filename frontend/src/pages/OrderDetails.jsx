import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getImageUrl, handleImageErrorWithFallback, FALLBACK_IMAGE } from '../services/api';

const TRACKING_STEPS = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/orders/${id}`);
        if (response.data.success && response.data.order) {
          setOrder(response.data.order);
        } else {
          setError('Order details not found.');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(
          err.response?.data?.message || 'Could not load order details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);


  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'status-badge-delivered';
      case 'Shipped':
      case 'Out for Delivery':
        return 'status-badge-transit';
      case 'Packed':
      case 'Confirmed':
      case 'Order Placed':
        return 'status-badge-processing';
      case 'Cancelled':
        return 'status-badge-cancelled';
      default:
        return 'status-badge-default';
    }
  };

  const currentStepIndex = order ? TRACKING_STEPS.indexOf(order.orderStatus) : -1;
  const isCancelled = order?.orderStatus === 'Cancelled';

  if (loading) {
    return (
      <div className="orders-page">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &rsaquo; <Link to="/orders">My Orders</Link> &rsaquo; Order Details
        </div>
        <div className="orders-loading-state">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="orders-page">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &rsaquo; <Link to="/orders">My Orders</Link> &rsaquo; Error
        </div>
        <div className="orders-error-box">
          <h2>Could Not Load Order</h2>
          <p>{error || 'Order not found.'}</p>
          <div style={{ marginTop: '16px' }}>
            <Link to="/orders" className="btn-primary btn-sm">
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="orders-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/orders">My Orders</Link> &rsaquo; {order.orderId}
      </div>

      {/* Top Banner Header */}
      <div className="order-details-top-header">
        <div>
          <span className="order-details-ref-label">Order Details</span>
          <h1 className="order-details-title">{order.orderId}</h1>
          <p className="order-details-placed-date">Placed on {formattedDate}</p>
        </div>
        <div className="order-details-header-badges">
          <span className="order-payment-badge">Payment: {order.paymentStatus || 'Paid'}</span>
          <span className={`order-status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
            {order.orderStatus}
          </span>
        </div>
      </div>

      {/* ── ORDER TRACKING PROGRESS ────────────────────────── */}
      <div className="order-tracking-card">
        <h3>Order Tracking</h3>

        {isCancelled ? (
          <div className="order-cancelled-notice">
            <strong>This order has been Cancelled.</strong>
            <p>If you have any questions regarding refunds or re-ordering, please contact customer support.</p>
          </div>
        ) : (
          <div className="order-tracking-stepper">
            {TRACKING_STEPS.map((step, idx) => {
              const isCompleted = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step}
                  className={`tracking-step ${isCompleted ? 'step-completed' : ''} ${
                    isCurrent ? 'step-current' : ''
                  }`}
                >
                  <div className="step-indicator">
                    <div className="step-dot">{idx + 1}</div>
                    {idx < TRACKING_STEPS.length - 1 && <div className="step-connector"></div>}
                  </div>
                  <div className="step-label-container">
                    <span className="step-name">{step}</span>
                    {isCurrent && <span className="step-tag">Current Status</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DETAILS 2-COLUMN GRID ──────────────────────────── */}
      <div className="order-details-grid">
        {/* Left Column: Delivery & Payment info */}
        <div className="order-details-info-col">
          {/* Delivery Address Card */}
          <div className="order-info-card">
            <h3>Delivery Details</h3>
            <div className="order-info-card-content">
              <p className="customer-name"><strong>{order.customer.fullName}</strong></p>
              <p className="customer-address">{order.customer.address}</p>
              <p className="customer-location">
                {order.customer.city}, {order.customer.state} - {order.customer.pincode}
              </p>
              <div className="customer-contact-meta">
                <p>Phone: <strong>{order.customer.phone}</strong></p>
                <p>Email: <strong>{order.customer.email}</strong></p>
              </div>
            </div>
          </div>

          {/* Payment Information Card */}
          <div className="order-info-card">
            <h3>Payment Information</h3>
            <div className="order-info-card-content">
              <div className="info-kv-row">
                <span>Payment Mode:</span>
                <strong>Razorpay (Test Mode)</strong>
              </div>
              <div className="info-kv-row">
                <span>Payment Status:</span>
                <strong style={{ color: '#166534' }}>{order.paymentStatus || 'Paid'}</strong>
              </div>
              {order.razorpayPaymentId && (
                <div className="info-kv-row">
                  <span>Payment ID:</span>
                  <code>{order.razorpayPaymentId}</code>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="info-kv-row">
                  <span>Razorpay Order:</span>
                  <code>{order.razorpayOrderId}</code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Ordered Items & Calculations */}
        <div className="order-details-summary-col">
          <div className="order-info-card">
            <h3>Ordered Products ({order.totalItems} items)</h3>
            <div className="order-items-table">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-detail-row">
                  <img
                    src={getImageUrl(item.image)}
                    alt={`${item.name} - ${item.colour}`}
                    className="order-item-detail-img"
                    onError={(e) => handleImageErrorWithFallback(e, item.image)}
                  />
                  <div className="order-item-detail-info">
                    <h4 className="order-item-detail-name">{item.name}</h4>
                    <div className="order-item-detail-badges">
                      <span className="detail-badge">Colour: {item.colour}</span>
                      <span className="detail-badge">Size: {item.size}</span>
                      {item.customName && (
                        <span className="detail-badge">Custom Name: {item.customName}</span>
                      )}
                    </div>
                    <p className="order-item-detail-qty">
                      Qty: {item.quantity} &times; ₹{item.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="order-item-detail-total">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <hr className="order-card-divider" />

            {/* Calculations Breakdown */}
            <div className="order-calc-table">
              <div className="order-calc-row">
                <span>Cart Subtotal</span>
                <span>₹{order.cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="order-calc-row">
                <span>Standard Delivery</span>
                <span className="free-shipping-tag">FREE</span>
              </div>
              <hr className="order-card-divider" />
              <div className="order-calc-row order-calc-total">
                <span>Total Amount Paid</span>
                <span>₹{order.finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Actions Footer */}
      <div className="order-details-actions-bar">
        <Link to="/orders" className="btn-secondary">
          Back to My Orders
        </Link>
        <Link to="/shop" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderDetails;
