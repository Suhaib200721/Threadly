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
    return (
      <div className="page-container">
        <h1>Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
        <p className="placeholder-note">This page is for admins only.</p>
      </div>
    );
  }

  return children;
}

export default AdminRoute;
