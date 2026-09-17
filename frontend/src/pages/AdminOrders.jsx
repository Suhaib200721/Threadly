import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_OPTIONS = [
  'All',
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const fetchAdminOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/orders');
      if (response.data.success) {
        setOrders(response.data.orders || []);
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
      } else {
        setError('Failed to load orders.');
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      setError(
        err.response?.data?.message || 'Could not load orders. Please check your admin connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (selectedStatus !== 'All' && order.orderStatus !== selectedStatus) {
        return false;
      }

      // 2. Search Term Filter (Order ID, Customer Name, Email)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesId = (order.orderId || '').toLowerCase().includes(term);
        const matchesName = (order.customer?.fullName || '').toLowerCase().includes(term);
        const matchesEmail = (order.customer?.email || '').toLowerCase().includes(term);
        const matchesPhone = (order.customer?.phone || '').toLowerCase().includes(term);

        return matchesId || matchesName || matchesEmail || matchesPhone;
      }

      return true;
    });
  }, [orders, selectedStatus, searchTerm]);

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
    <div className="admin-orders-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/admin">Admin</Link> &rsaquo; Orders Management
      </div>

      <div className="admin-orders-header">
        <div>
          <h1>Admin Orders Management</h1>
          <p className="admin-orders-subtitle">
            Manage customer orders, view delivery information, and update shipment statuses.
          </p>
        </div>
        <button
          className="btn-secondary btn-sm"
          onClick={fetchAdminOrders}
          disabled={loading}
          title="Refresh orders from database"
        >
          {loading ? 'Refreshing...' : '↻ Refresh Orders'}
        </button>
      </div>

      {/* ── SUMMARY STATS CARDS ──────────────────────────────── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Orders</span>
          <strong className="stat-value">{summary.total}</strong>
        </div>
        <div className="admin-stat-card stat-card-paid">
          <span className="stat-label">Paid Orders</span>
          <strong className="stat-value">{summary.paid}</strong>
        </div>
        <div className="admin-stat-card stat-card-pending">
          <span className="stat-label">Pending / Processing</span>
          <strong className="stat-value">{summary.pending}</strong>
        </div>
        <div className="admin-stat-card stat-card-delivered">
          <span className="stat-label">Delivered</span>
          <strong className="stat-value">{summary.delivered}</strong>
        </div>
        <div className="admin-stat-card stat-card-cancelled">
          <span className="stat-label">Cancelled</span>
          <strong className="stat-value">{summary.cancelled}</strong>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ─────────────────────────── */}
      <div className="admin-filters-card">
        <div className="admin-search-box">
          <label htmlFor="adminSearch">Search Orders</label>
          <input
            type="text"
            id="adminSearch"
            placeholder="Search by Order ID, Customer Name, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-status-filter-box">
          <label htmlFor="statusFilter">Filter by Status</label>
          <select
            id="statusFilter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'All' ? 'All Statuses' : status}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || selectedStatus !== 'All') && (
          <button
            className="btn-secondary btn-sm btn-clear-filters"
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('All');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── ORDERS CONTENT ───────────────────────────────────── */}
      {loading && (
        <div className="admin-loading-box">
          <p>Loading orders from database...</p>
        </div>
      )}

      {!loading && error && (
        <div className="admin-error-box">
          <p>{error}</p>
          <button className="btn-secondary btn-sm" onClick={fetchAdminOrders} style={{ marginTop: '10px' }}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="admin-empty-box">
          <h2>No Orders Found in Database</h2>
          <p>When customers place orders via checkout, they will appear here.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
        <div className="admin-empty-box">
          <h2>No Matching Orders</h2>
          <p>No orders match your search term &quot;{searchTerm}&quot; or selected filter.</p>
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('All');
            }}
            style={{ marginTop: '12px' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-count-label">
            Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
          </div>
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={order._id || order.orderId}>
                    <td>
                      <strong className="order-id-cell">{order.orderId}</strong>
                    </td>
                    <td className="order-date-cell">{formattedDate}</td>
                    <td>
                      <div className="customer-cell">
                        <strong className="customer-cell-name">{order.customer?.fullName}</strong>
                        <span className="customer-cell-email">{order.customer?.email}</span>
                      </div>
                    </td>
                    <td className="order-phone-cell">{order.customer?.phone}</td>
                    <td>
                      <span className="order-items-badge">{order.totalItems} items</span>
                    </td>
                    <td>
                      <strong>₹{order.finalTotal.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className="order-payment-badge">{order.paymentStatus || 'Paid'}</span>
                    </td>
                    <td>
                      <span className={`order-status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/admin/orders/${order.orderId || order._id}`}
                        className="btn-primary btn-sm admin-view-btn"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
