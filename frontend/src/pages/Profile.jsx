import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Profile() {
  const { user, token, updateUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Profile data states
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch full profile info from backend on mount
  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setLoadingProfile(true);
      const res = await api.get('/users/profile');
      if (res.data?.user) {
        setProfileData(res.data.user);
        setName(res.data.user.name || '');
        setEmail(res.data.user.email || '');
      } else if (user) {
        setProfileData(user);
        setName(user.name || '');
        setEmail(user.email || '');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      if (user) {
        setProfileData(user);
        setName(user.name || '');
        setEmail(user.email || '');
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle Edit Profile submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    // Client-side validations
    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await api.put('/users/profile', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });

      const data = res.data;
      setProfileSuccess(data.message || 'Profile updated successfully.');
      if (data.user) {
        setProfileData(data.user);
        updateUser(data.user); // Synchronize context and localStorage
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(err.response?.data?.message || 'A network error occurred. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Change Password submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    // Client-side validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.put('/users/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      const data = res.data;
      setPasswordSuccess(data.message || 'Password changed successfully.');
      // Clear password form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError(err.response?.data?.message || 'A network error occurred. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Format date helper
  const formatMemberDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // User initials
  const getInitials = (userName) => {
    if (!userName) return 'U';
    const parts = userName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        {/* Page Heading */}
        <div className="profile-header-section">
          <div>
            <h1>My Account</h1>
            <p className="profile-header-sub">
              Manage your personal information, security settings, and view recent orders.
            </p>
          </div>
          <button className="btn btn-secondary profile-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Quick Navigation Cards */}
        <div className="profile-quick-nav-grid">
          <Link to="/orders" className="profile-nav-card">
            <div className="nav-card-info">
              <h3>My Orders</h3>
              <p>Track packages and review past orders</p>
            </div>
          </Link>

          <Link to="/wishlist" className="profile-nav-card">
            <div className="nav-card-info">
              <h3>My Wishlist</h3>
              <p>View your saved favorite T-shirts</p>
            </div>
          </Link>

          <Link to="/cart" className="profile-nav-card">
            <div className="nav-card-info">
              <h3>Shopping Cart</h3>
              <p>View saved items ready for checkout</p>
            </div>
          </Link>

          <Link to="/shop" className="profile-nav-card">
            <div className="nav-card-info">
              <h3>Shop Collection</h3>
              <p>Explore all 8 styles and colorways</p>
            </div>
          </Link>

          {isAdmin && (
            <Link to="/admin" className="profile-nav-card admin-highlight-card">
              <div className="nav-card-info">
                <h3>Admin Portal</h3>
                <p>Manage orders, products, and reviews</p>
              </div>
            </Link>
          )}
        </div>

        {/* Main 2-Column Profile Content Layout */}
        <div className="profile-content-grid">
          {/* Left Column: Account Overview Card */}
          <div className="profile-left-col">
            <div className="profile-card profile-overview-card">
              <div className="profile-avatar-circle">
                {getInitials(profileData?.name || user?.name)}
              </div>
              <h2 className="profile-name-title">{profileData?.name || user?.name || 'Customer'}</h2>
              <p className="profile-email-text">{profileData?.email || user?.email}</p>

              <div className="profile-badge-row">
                <span className={`profile-role-tag ${isAdmin ? 'tag-admin' : 'tag-customer'}`}>
                  {isAdmin ? 'Admin' : 'Customer'}
                </span>
              </div>

              <div className="profile-meta-divider" />

              <div className="profile-meta-list">
                <div className="profile-meta-item">
                  <span className="meta-label">Account Status:</span>
                  <span className="meta-value status-active">Active</span>
                </div>
                <div className="profile-meta-item">
                  <span className="meta-label">Member Since:</span>
                  <span className="meta-value">
                    {formatMemberDate(profileData?.createdAt)}
                  </span>
                </div>
                <div className="profile-meta-item">
                  <span className="meta-label">Account Type:</span>
                  <span className="meta-value">
                    {isAdmin ? 'Store Administrator' : 'Standard Buyer'}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div className="profile-admin-actions">
                  <h4>Admin Shortcuts</h4>
                  <div className="admin-shortcuts-list">
                    <Link to="/admin/orders" className="admin-shortcut-btn">
                      Orders Management
                    </Link>
                    <Link to="/admin/reviews" className="admin-shortcut-btn">
                      Reviews Moderation
                    </Link>
                    <Link to="/admin/products" className="admin-shortcut-btn">
                      Product Catalog
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Edit Profile & Change Password Cards */}
          <div className="profile-right-col">
            {/* 1. Edit Profile Form Card */}
            <div className="profile-card">
              <div className="card-header-bar">
                <h2>Personal Information</h2>
                <p>Update your personal details below.</p>
              </div>

              {profileSuccess && (
                <div className="profile-alert profile-alert-success">
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="profile-alert profile-alert-error">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label htmlFor="profile-name">
                    Full Name <span className="req-star">*</span>
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile-email">
                    Email Address <span className="req-star">*</span>
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    className="form-control"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile-role">Account Role</label>
                  <input
                    id="profile-role"
                    type="text"
                    className="form-control form-control-disabled"
                    value={isAdmin ? 'Admin' : 'Customer'}
                    disabled
                  />
                  <small className="form-help-text">
                    Account roles are managed securely by the platform.
                  </small>
                </div>

                <div className="profile-form-footer">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Change Password Form Card */}
            <div className="profile-card">
              <div className="card-header-bar">
                <h2>Security & Password</h2>
                <p>Ensure your account is using a strong password of at least 6 characters.</p>
              </div>

              {passwordSuccess && (
                <div className="profile-alert profile-alert-success">
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="profile-alert profile-alert-error">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label htmlFor="current-password">
                    Current Password <span className="req-star">*</span>
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-grid">
                  <div className="form-group">
                    <label htmlFor="new-password">
                      New Password <span className="req-star">*</span>
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      className="form-control"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm-password">
                      Confirm New Password <span className="req-star">*</span>
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      className="form-control"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="profile-form-footer">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
