import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const infoMessage = location.state?.message;

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic client-side validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Save token and user in context + localStorage
      login(user, token);

      // Redirect based on role or previous location
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (location.state?.from) {
        navigate(location.state.from);
      } else {
        navigate('/');
      }

    } catch (err) {
      // Show the error message returned by the backend
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-card">
        <h1>Login</h1>
        <p className="form-subtitle">Welcome back to THREADLY</p>

        {/* Info message (e.g. Please login to place your order.) */}
        {infoMessage && (
          <div
            style={{
              backgroundColor: '#f9f9f9',
              border: '1px solid #111',
              color: '#111',
              padding: '10px 14px',
              borderRadius: '4px',
              marginBottom: '18px',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            {infoMessage}
          </div>
        )}

        {/* Error message */}
        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="form-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
