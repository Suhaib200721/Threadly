const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────
// protect — checks if user is logged in via JWT
// ─────────────────────────────────────────────
const protect = (req, res, next) => {
  // 1. Read the Authorization header
  const authHeader = req.headers.authorization;

  // 2. Check if header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  // 3. Extract the token (remove "Bearer " prefix)
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verify the token using the secret from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach user info to the request object for use in next middleware/controller
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // 6. Move on to the next function
    next();

  } catch (error) {
    return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
  }
};

// ─────────────────────────────────────────────
// adminOnly — checks if the logged-in user is an admin
// Must be used AFTER protect middleware
// ─────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // user is admin, allow access
  } else {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

// ─────────────────────────────────────────────
// optionalAuth — extracts user if token provided, continues without error if not
// ─────────────────────────────────────────────
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
      };
    } catch (error) {
      // Invalid/expired token — proceed without authenticated user
      req.user = null;
    }
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };


