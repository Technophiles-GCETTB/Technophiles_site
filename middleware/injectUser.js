const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Notification } = require('../models/index');
const SiteSettings = require('../models/SiteSettings');

// Injects req.user, res.locals.currentUser, and res.locals.siteSettings into every request
const injectUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
        res.locals.currentUser = user;
        const unreadCount = await Notification.countDocuments({ 
          recipient: user._id, 
          isRead: false 
        });
        res.locals.unreadNotifications = unreadCount;
      }
    }
  } catch (err) {
    res.clearCookie('token');
  }

  res.locals.currentUser = res.locals.currentUser || null;
  res.locals.unreadNotifications = res.locals.unreadNotifications || 0;

  // Inject site settings (cached per process, refresh every 5 min)
  try {
    const now = Date.now();
    if (!global._siteSettings || (now - (global._siteSettingsTime || 0)) > 5 * 60 * 1000) {
      global._siteSettings = await SiteSettings.findOne() || {};
      global._siteSettingsTime = now;
    }
    res.locals.siteSettings = global._siteSettings;
  } catch (err) {
    res.locals.siteSettings = {};
  }

  next();
};

// Call after settings change to clear cache
const clearSettingsCache = () => { global._siteSettings = null; };

module.exports = { injectUser, clearSettingsCache };
