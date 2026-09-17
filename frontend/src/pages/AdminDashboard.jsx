import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/stats');
      if (response.data.success && response.data.stats) {
        setStats(response.data.stats);
      } else {
        setError('Failed to load dashboard statistics.');
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(
        err.response?.data?.message ||
          'Could not load statistics. Please check your backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; Admin Dashboard
      </div>

      <div className="admin-page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome, <strong>{user?.name || 'Admin'}</strong>! Store overview and management shortcuts.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={fetchStats}
          disabled={loading}
          title="Refresh statistics"
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div className="admin-error-box" style={{ marginBottom: '20px' }}>
          <p>{error}</p>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={fetchStats}
            style={{ marginTop: '8px' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── 4 STAT CARDS MATCHING THREADLY CARD STYLE ── */}
      <div className="admin-metrics-grid">
        <Link to="/admin/products" className="admin-metric-card">
          <span className="admin-metric-label">Total Products</span>
          <strong className="admin-metric-number">
            {loading ? '—' : stats.totalProducts}
          </strong>
          <span className="admin-metric-action">Manage Products &rsaquo;</span>
        </Link>

        <Link to="/admin/orders" className="admin-metric-card">
          <span className="admin-metric-label">Total Orders</span>
          <strong className="admin-metric-number">
            {loading ? '—' : stats.totalOrders}
          </strong>
          <span className="admin-metric-action">View Orders &rsaquo;</span>
        </Link>

        <Link to="/admin/users" className="admin-metric-card">
          <span className="admin-metric-label">Total Users</span>
          <strong className="admin-metric-number">
            {loading ? '—' : stats.totalUsers}
          </strong>
          <span className="admin-metric-action">View Users &rsaquo;</span>
        </Link>

        <Link to="/admin/reviews" className="admin-metric-card">
          <span className="admin-metric-label">Total Reviews</span>
          <strong className="admin-metric-number">
            {loading ? '—' : stats.totalReviews}
          </strong>
          <span className="admin-metric-action">Moderate Reviews &rsaquo;</span>
        </Link>
      </div>

      {/* ── STORE SUMMARY & QUICK ACTIONS MATCHING THREADLY SECTIONS ── */}
      <div className="admin-dashboard-sections">
        {/* Store Summary Card */}
        <section className="admin-content-section">
          <h2>Store Summary</h2>
          <div className="admin-summary-row">
            <div className="admin-summary-item">
              <span className="summary-label">Total Paid Revenue</span>
              <strong className="summary-val">
                ₹{stats.totalRevenue.toLocaleString()}
              </strong>
            </div>
            <div className="admin-summary-item">
              <span className="summary-label">Pending / Processing Orders</span>
              <strong className="summary-val">{stats.pendingOrders}</strong>
            </div>
          </div>
        </section>

        {/* Quick Actions Card */}
        <section className="admin-content-section">
          <h2>Quick Actions</h2>
          <div className="admin-actions-row">
            <Link to="/admin/products" className="btn-primary">
              + Add / Edit Products
            </Link>
            <Link to="/admin/orders" className="btn-primary">
              Manage Orders
            </Link>
            <Link to="/admin/users" className="btn-secondary">
              Registered Users
            </Link>
            <Link to="/admin/reviews" className="btn-secondary">
              Customer Reviews
            </Link>
            <Link to="/" className="btn-secondary">
              View Storefront
            </Link>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
