import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl, handleImageErrorWithFallback, FALLBACK_IMAGE } from '../services/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/orders');
      if (response.data.success) {
        setOrders(response.data.orders || []);
      } else {
        setError('Failed to load orders.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(
        err.response?.data?.message || 'Could not load your orders. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);


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

  return (
    <div className="orders-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; My Orders
      </div>

      <div className="orders-header">
        <h1>My Orders</h1>
        <p className="orders-header-subtitle">
          View your complete order history, payment details, and track shipment status.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="orders-loading-state">
          <p>Loading your orders...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="orders-error-box">
          <p>{error}</p>
          <button className="btn-secondary btn-sm" onClick={fetchOrders} style={{ marginTop: '12px' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty orders state */}
      {!loading && !error && orders.length === 0 && (
        <div className="orders-empty-card">
          <h2>No orders yet</h2>
          <p>You haven&apos;t placed any orders so far. Explore our collection of custom premium T-shirts.</p>
          <Link to="/shop" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Continue Shopping
          </Link>
        </div>
      )}

      {/* Orders list */}
      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div key={order._id || order.orderId} className="order-card">
                {/* Card Header */}
                <div className="order-card-header">
                  <div className="order-card-header-left">
                    <div>
                      <span className="order-card-label">Order Reference:</span>
                      <strong className="order-card-id">{order.orderId}</strong>
                    </div>
                    <div className="order-card-date">
                      Placed on {formattedDate}
                    </div>
                  </div>

                  <div className="order-card-header-right">
                    <span className="order-payment-badge">
                      Payment: {order.paymentStatus || 'Paid'}
                    </span>
                    <span className={`order-status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Card Items List */}
                <div className="order-card-body">
                  <div className="order-items-grid">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item-mini-row">
                        <img
                          src={getImageUrl(item.image)}
                          alt={`${item.name} - ${item.colour}`}
                          className="order-item-mini-img"
                          onError={(e) => handleImageErrorWithFallback(e, item.image)}
                        />
                        <div className="order-item-mini-details">
                          <h4 className="order-item-mini-name">{item.name}</h4>
                          <p className="order-item-mini-meta">
                            Colour: <strong>{item.colour}</strong> &bull; Size: <strong>{item.size}</strong>
                            {item.customName && <> &bull; Custom Name: <strong>{item.customName}</strong></>} &bull; Qty: <strong>{item.quantity}</strong>
                          </p>
                          <p className="order-item-mini-price">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="order-card-footer">
                  <div className="order-card-total">
                    <span>Total Amount:</span>
                    <strong>₹{order.finalTotal.toLocaleString()}</strong>
                    <span className="order-card-items-count">({order.totalItems} items)</span>
                  </div>

                  <Link
                    to={`/orders/${order.orderId || order._id}`}
                    className="btn-primary btn-sm"
                  >
                    View Details & Track
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;
