import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps a page that only logged-in users can see.
// If not logged in → redirect to /login
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // Wait until we have checked localStorage before deciding
  if (loading) {
    return <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p>;
  }

  if (!isLoggedIn) {
    const isCheckout = location.pathname === '/checkout';
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          message: isCheckout ? 'Please login to place your order.' : undefined,
        }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
