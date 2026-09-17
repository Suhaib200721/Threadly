import { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AuthContext = createContext();

// Custom hook — makes it easy to use AuthContext in any component
export function useAuth() {
  return useContext(AuthContext);
}

// AuthProvider wraps the whole app so all pages can access auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // logged-in user info
  const [token, setToken] = useState(null);     // JWT token
  const [loading, setLoading] = useState(true); // true while checking localStorage on first load

  // When the app first loads, check if a token is saved in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('threadly_token');
    const savedUser = localStorage.getItem('threadly_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false); // done checking
  }, []);

  // Called after a successful login or register API response
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('threadly_token', jwtToken);
    localStorage.setItem('threadly_user', JSON.stringify(userData));
  };

  // Called when user updates their profile details
  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem('threadly_user', JSON.stringify(merged));
      return merged;
    });
  };

  // Called when user clicks Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('threadly_token');
    localStorage.removeItem('threadly_user');
  };

  // The value shared to all components using this context
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isLoggedIn: !!user,           // true if user is not null
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
