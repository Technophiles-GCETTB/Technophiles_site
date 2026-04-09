const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Authenticate JWT ─────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                    ? req.headers.authorization.split(' ')[1] 
                    : null);

    if (!token) {
      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      req.flash = { type: 'error', message: 'Please login to continue' };
      return res.redirect('/auth/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    return res.redirect('/auth/login');
  }
};

// ─── Optional Auth (doesn't block, just sets req.user) ────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch (err) {
    // Silent fail - optional auth
  }
  next();
};

// ─── Require Role(s) ──────────────────────────────────────────────────────────
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/auth/login');
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: `This page requires one of these roles: ${roles.join(', ')}`,
        user: req.user
      });
    }
    next();
  };
};

// ─── Require Permission ───────────────────────────────────────────────────────
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/auth/login');
    }
    if (!req.user.hasPermission(permission)) {
      return res.status(403).render('error', {
        title: 'Permission Denied',
        message: 'You do not have permission to perform this action.',
        user: req.user
      });
    }
    next();
  };
};

// ─── Redirect if already logged in ───────────────────────────────────────────
const guestOnly = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect('/dashboard');
    } catch (err) {
      res.clearCookie('token');
    }
  }
  next();
};

// ─── Admin Only shorthand ─────────────────────────────────────────────────────
const adminOnly = requireRole('superadmin', 'admin');

module.exports = { authenticate, optionalAuth, requireRole, requirePermission, guestOnly, adminOnly };
