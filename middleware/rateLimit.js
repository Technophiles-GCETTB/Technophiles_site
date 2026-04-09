/**
 * Simple in-memory rate limiter (no external dependency).
 * For production, replace with express-rate-limit + redis store.
 */
const rateMap = new Map();

/**
 * @param {number} maxRequests - max requests per window
 * @param {number} windowMs    - window size in milliseconds
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const record = rateMap.get(key);

    if (!record || now - record.start > windowMs) {
      rateMap.set(key, { count: 1, start: now });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil((record.start + windowMs - now) / 1000),
      });
    }

    next();
  };
};

/** Strict limiter for auth endpoints */
const authLimiter = rateLimit(10, 15 * 60 * 1000);   // 10 per 15 min

/** General API limiter */
const apiLimiter = rateLimit(200, 15 * 60 * 1000);    // 200 per 15 min

// Clean up old records every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [key, val] of rateMap) {
    if (val.start < cutoff) rateMap.delete(key);
  }
}, 5 * 60 * 1000);

module.exports = { rateLimit, authLimiter, apiLimiter };
