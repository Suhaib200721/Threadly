import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="form-card">
        <h1>Admin Dashboard</h1>
        <p className="form-success">Welcome, {user?.name}! You are logged in as admin.</p>

        <div className="profile-info">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>

        {/* Admin navigation links */}
        <div className="admin-nav-links">
          <h3>Manage</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/admin/orders" className="btn-primary admin-nav-btn">
              Orders Management
            </Link>
            <Link to="/admin/products" className="btn-primary admin-nav-btn">
              Products &amp; Categories
            </Link>
            <Link to="/admin/reviews" className="btn-primary admin-nav-btn">
              Reviews Moderation
            </Link>
          </div>

        </div>


        <p className="admin-footer-note" style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Manage your THREADLY e-commerce catalog, process customer orders, and moderate reviews.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
