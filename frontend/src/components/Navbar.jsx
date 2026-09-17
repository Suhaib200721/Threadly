import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

function Navbar() {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" aria-label="Main Navigation">
      {/* Top Header Row (Brand Logo + Quick Actions on Mobile) */}
      <div className="navbar-top-row">
        <div className="navbar-brand">
          <Link to="/" aria-label="THREADLY Home">THREADLY</Link>
        </div>

        {/* Mobile Quick Actions (Wishlist + Cart) */}
        <div className="navbar-mobile-actions">
          {isLoggedIn && (
            <Link to="/wishlist" className="navbar-wishlist-link" title="My Wishlist" aria-label="Wishlist">
              <span className="wishlist-label">Wishlist</span>
              {totalWishlist > 0 && (
                <span className="navbar-wishlist-badge">{totalWishlist}</span>
              )}
            </Link>
          )}

          <Link to="/cart" className="navbar-cart-link" title="Shopping Cart" aria-label="Cart">
            <span className="cart-label">Cart</span>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
        </div>
      </div>

      {/* Main Navigation Links List */}
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/shop">Shop</Link>
        </li>

        {/* Guest Links */}
        {!isLoggedIn && (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}

        {/* Authenticated Customer Links */}
        {isLoggedIn && (
          <>
            {/* Admin Links */}
            {isAdmin && (
              <>
                <li>
                  <Link to="/admin" className="admin-link">Dashboard</Link>
                </li>
                <li>
                  <Link to="/admin/orders" className="admin-link">Admin Orders</Link>
                </li>
                <li>
                  <Link to="/admin/products" className="admin-link">Catalog</Link>
                </li>
                <li>
                  <Link to="/admin/users" className="admin-link">Users</Link>
                </li>
                <li>
                  <Link to="/admin/reviews" className="admin-link">Reviews</Link>
                </li>
              </>
            )}

            <li>
              <Link to="/orders">My Orders</Link>
            </li>

            {/* Desktop Wishlist link */}
            <li className="desktop-nav-wishlist">
              <Link to="/wishlist" className="navbar-wishlist-link">
                Wishlist
                {totalWishlist > 0 && (
                  <span className="navbar-wishlist-badge">{totalWishlist}</span>
                )}
              </Link>
            </li>

            <li>
              <Link to="/profile">Profile</Link>
            </li>

            <li>
              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
                aria-label="Log out of your account"
              >
                Logout
              </button>
            </li>
          </>
        )}
      </ul>

      {/* Desktop Cart Action */}
      <div className="navbar-cart desktop-cart-col">
        <Link to="/cart" className="navbar-cart-link" title="Shopping Cart">
          <span className="cart-label">Cart</span>
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
