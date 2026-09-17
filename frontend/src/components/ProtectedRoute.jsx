import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps a page that only logged-in users can see.
// If not logged in → redirect to /login
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  // Wait until we have checked localStorage before deciding
  if (loading) {
    return <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
