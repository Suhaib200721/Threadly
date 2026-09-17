import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const FALLBACK_IMAGE = 'https://placehold.co/300x400/eeeeee/999999.png?text=No+Image';

const VALID_STATUSES = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/admin/orders/${id}`);
      if (response.data.success && response.data.order) {
        setOrder(response.data.order);
        setSelectedStatus(response.data.order.orderStatus);
      } else {
        setError('Order not found.');
      }
    } catch (err) {
      console.error('Error fetching admin order detail:', err);
      setError(
        err.response?.data?.message || 'Could not load order details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === order?.orderStatus) {
      return;
    }

    setUpdating(true);
    setSuccessMessage('');
    setError('');

    try {
      const response = await api.put(`/admin/orders/${id}/status`, {
        status: selectedStatus,
      });

      if (response.data.success && response.data.order) {
        setOrder(response.data.order);
        setSelectedStatus(response.data.order.orderStatus);
        setSuccessMessage(`Order status successfully updated to "${response.data.order.orderStatus}".`);
      } else {
        setError(response.data.message || 'Could not update order status.');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setError(
        err.response?.data?.message || 'Server error updating order status.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
  };

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

  if (loading) {
    return (
      <div className="admin-orders-page">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &rsaquo; <Link to="/admin">Admin</Link> &rsaquo; <Link to="/admin/orders">Orders</Link> &rsaquo; Order Details
        </div>
        <div className="admin-loading-box">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="admin-orders-page">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &rsaquo; <Link to="/admin">Admin</Link> &rsaquo; <Link to="/admin/orders">Orders</Link> &rsaquo; Error
        </div>
        <div className="admin-error-box">
          <h2>Could Not Load Order</h2>
          <p>{error || 'Order not found.'}</p>
          <Link to="/admin/orders" className="btn-primary btn-sm" style={{ marginTop: '14px', display: 'inline-block' }}>
            Back to Orders List
          </Link>
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
    <div className="admin-orders-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/admin">Admin</Link> &rsaquo; <Link to="/admin/orders">Orders</Link> &rsaquo; {order.orderId}
      </div>

      {/* Header */}
      <div className="admin-detail-header">
        <div>
          <span className="admin-detail-label">Admin Order Inspection</span>
          <h1 className="admin-detail-title">{order.orderId}</h1>
          <p className="admin-detail-date">Placed on {formattedDate}</p>
        </div>

        <div className="admin-detail-header-right">
          <span className="order-payment-badge">Payment: {order.paymentStatus || 'Paid'}</span>
          <span className={`order-status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
            {order.orderStatus}
          </span>
        </div>
      </div>

      {/* ── STATUS UPDATER CARD ──────────────────────────────── */}
      <div className="admin-status-updater-card">
        <h3>Update Order Status</h3>
        <p className="status-updater-desc">
          Changing this status will immediately update the customer&apos;s shipment tracking view.
        </p>

        {successMessage && (
          <div className="status-updater-alert-success">
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="status-updater-alert-error">
            <span>{error}</span>
          </div>
        )}

        <form className="status-updater-form" onSubmit={handleUpdateStatus}>
          <div className="status-select-wrap">
            <label htmlFor="statusSelect">Select New Status:</label>
            <select
              id="statusSelect"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setSuccessMessage('');
                setError('');
              }}
              disabled={updating}
            >
              {VALID_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary status-submit-btn"
            disabled={updating || selectedStatus === order.orderStatus}
          >
            {updating ? 'Updating Status...' : 'Update Status'}
          </button>
        </form>
      </div>

      {/* ── 2-COLUMN DETAILS GRID ────────────────────────────── */}
      <div className="admin-detail-grid">
        {/* Left Column: Customer & Payment */}
        <div className="admin-detail-info-col">
          {/* Customer Information */}
          <div className="admin-info-card">
            <h3>Customer & Delivery Address</h3>
            <div className="admin-info-content">
              <p><strong>Full Name:</strong> {order.customer?.fullName}</p>
              <p><strong>Email:</strong> {order.customer?.email}</p>
              <p><strong>Phone:</strong> {order.customer?.phone}</p>
              <hr className="admin-card-divider" />
              <p><strong>Street Address:</strong> {order.customer?.address}</p>
              <p><strong>City:</strong> {order.customer?.city}</p>
              <p><strong>State:</strong> {order.customer?.state}</p>
              <p><strong>Pincode:</strong> {order.customer?.pincode}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="admin-info-card">
            <h3>Payment Details</h3>
            <div className="admin-info-content">
              <div className="admin-kv-row">
                <span>Payment Mode:</span>
                <strong>Razorpay (Test Mode)</strong>
              </div>
              <div className="admin-kv-row">
                <span>Payment Status:</span>
                <strong style={{ color: '#166534' }}>{order.paymentStatus || 'Paid'}</strong>
              </div>
              {order.razorpayPaymentId && (
                <div className="admin-kv-row">
                  <span>Razorpay Payment ID:</span>
                  <code>{order.razorpayPaymentId}</code>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="admin-kv-row">
                  <span>Razorpay Order ID:</span>
                  <code>{order.razorpayOrderId}</code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Ordered Items & Calculations */}
        <div className="admin-detail-items-col">
          <div className="admin-info-card">
            <h3>Ordered Products ({order.totalItems} items)</h3>
            <div className="admin-items-list">
              {order.items.map((item, idx) => (
                <div key={idx} className="admin-item-row">
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt={`${item.name} - ${item.colour}`}
                    className="admin-item-img"
                    onError={handleImageError}
                  />
                  <div className="admin-item-details">
                    <h4 className="admin-item-name">{item.name}</h4>
                    <div className="admin-item-badges">
                      <span className="admin-badge">Colour: {item.colour}</span>
                      <span className="admin-badge">Size: {item.size}</span>
                      {item.customName && (
                        <span className="admin-badge">Custom Name: {item.customName}</span>
                      )}
                    </div>
                    <p className="admin-item-meta">
                      Qty: {item.quantity} &times; ₹{item.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="admin-item-subtotal">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <hr className="admin-card-divider" />

            <div className="admin-calc-box">
              <div className="admin-calc-row">
                <span>Cart Subtotal</span>
                <span>₹{order.cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="admin-calc-row">
                <span>Shipping</span>
                <span style={{ color: '#166534', fontWeight: 600 }}>FREE</span>
              </div>
              <hr className="admin-card-divider" />
              <div className="admin-calc-row admin-calc-total">
                <span>Final Total Paid</span>
                <span>₹{order.finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="admin-detail-footer">
        <Link to="/admin/orders" className="btn-secondary">
          Back to All Orders
        </Link>
      </div>
    </div>
  );
}

export default AdminOrderDetail;
