import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users');
      if (response.data.success && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        setError('Failed to load user accounts.');
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError(
        err.response?.data?.message ||
          'Could not retrieve users. Please verify admin authorization.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Role filter
      if (roleFilter !== 'All' && u.role !== roleFilter) {
        return false;
      }

      // 2. Search term (name or email)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = (u.name || '').toLowerCase().includes(term);
        const matchesEmail = (u.email || '').toLowerCase().includes(term);
        return matchesName || matchesEmail;
      }

      return true;
    });
  }, [users, roleFilter, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  };

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalCustomers = users.filter((u) => u.role !== 'admin').length;

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/admin">Admin</Link> &rsaquo; Registered Users
      </div>

      <div className="admin-page-header">
        <div>
          <h1>Registered Users Management</h1>
          <p className="admin-page-subtitle">
            View customer accounts and admin users registered on THREADLY.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh users from database"
        >
          {loading ? 'Refreshing...' : '↻ Refresh Users'}
        </button>
      </div>

      {/* ── SUMMARY STATS ── */}
      <div className="admin-metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-metric-card">
          <span className="admin-metric-label">Total Users</span>
          <strong className="admin-metric-number">{users.length}</strong>
        </div>
        <div className="admin-metric-card">
          <span className="admin-metric-label">Customer Accounts</span>
          <strong className="admin-metric-number">{totalCustomers}</strong>
        </div>
        <div className="admin-metric-card">
          <span className="admin-metric-label">Admin Accounts</span>
          <strong className="admin-metric-number">{totalAdmins}</strong>
        </div>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="admin-filters-card">
        <div className="admin-search-box">
          <label htmlFor="userSearch">Search Users</label>
          <input
            type="text"
            id="userSearch"
            placeholder="Search by name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-status-filter-box">
          <label htmlFor="roleFilter">Filter by Role</label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="user">Customers (user)</option>
            <option value="admin">Administrators (admin)</option>
          </select>
        </div>

        {(searchTerm || roleFilter !== 'All') && (
          <button
            type="button"
            className="btn-secondary btn-sm btn-clear-filters"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('All');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── LOADING / ERROR / EMPTY STATES ── */}
      {loading && (
        <div className="admin-loading-box">
          <p>Loading registered users from database...</p>
        </div>
      )}

      {!loading && error && (
        <div className="admin-error-box">
          <p>{error}</p>
          <button className="btn-secondary btn-sm" onClick={fetchUsers} style={{ marginTop: '10px' }}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="admin-empty-box">
          <h2>No Registered Users Found</h2>
          <p>When users register, their accounts will appear here.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && filteredUsers.length === 0 && (
        <div className="admin-empty-box">
          <h2>No Matching Users</h2>
          <p>No user matches your search term &quot;{searchTerm}&quot;.</p>
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('All');
            }}
            style={{ marginTop: '12px' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ── USERS TABLE ── */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-count-label">
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> registered users
          </div>
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Identity</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isCurrent = currentUser?._id === u._id || currentUser?.email === u.email;
                return (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`role-badge ${
                          u.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'
                        }`}
                      >
                        {u.role === 'admin' ? 'Administrator' : 'Customer'}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      {isCurrent ? (
                        <span className="you-badge" title="This is your currently active admin session">
                          ● Active Session (You)
                        </span>
                      ) : (
                        <span style={{ color: '#888', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminUsers;
