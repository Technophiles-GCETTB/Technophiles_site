const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Notification } = require('../models/index');
const User = require('../models/User');

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Mark all notifications read
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Get notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).limit(20);
    const unread = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, notifications, unread });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Search users (admin)
router.get('/users/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).limit(10).select('name email avatar role');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
