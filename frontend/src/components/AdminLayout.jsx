import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-wrapper">
      {/* THREADLY Admin Sub-Navigation Bar */}
      <div className="admin-subnav-bar">
        <div className="admin-subnav-container">
          <div className="admin-subnav-brand-row">
            <div className="admin-subnav-label">
              <span className="admin-portal-tag">Admin</span>
              <span className="admin-subnav-title">Management</span>
            </div>

            <div className="admin-subnav-user">
              <span className="admin-user-text">
                Signed in as <strong>{user?.name || 'Admin'}</strong>
              </span>
              <button
                type="button"
                className="admin-subnav-logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Clean Navigation Links */}
          <nav className="admin-subnav-links" aria-label="Admin Navigation">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `admin-subnav-link ${isActive ? 'active' : ''}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `admin-subnav-link ${isActive ? 'active' : ''}`
              }
            >
              Products
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `admin-subnav-link ${isActive ? 'active' : ''}`
              }
            >
              Orders
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `admin-subnav-link ${isActive ? 'active' : ''}`
              }
            >
              Users
            </NavLink>

            <NavLink
              to="/admin/reviews"
              className={({ isActive }) =>
                `admin-subnav-link ${isActive ? 'active' : ''}`
              }
            >
              Reviews
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Main Admin Page Content Container */}
      <div className="admin-page-container">
        {children}
      </div>
    </div>
  );
}

export default AdminLayout;
