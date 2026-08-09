const { ActivityLog } = require('../models/index');

const logActivity = (action, entity = null) => {
  return async (req, res, next) => {
    // Log after response
    const originalSend = res.json.bind(res);
    res.json = function (data) {
      if (req.user) {
        ActivityLog.create({
          user: req.user._id,
          action,
          entity,
          entityId: req.params.id,
          details: { method: req.method, path: req.path, body: req.body },
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }).catch(console.error);
      }
      return originalSend(data);
    };
    next();
  };
};

module.exports = { logActivity };
