import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps a page that only admins can see.
// If not logged in → redirect to /login
// If logged in but not admin → show Unauthorized message
function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  // Wait until we have checked localStorage before deciding
  if (loading) {
    return <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
