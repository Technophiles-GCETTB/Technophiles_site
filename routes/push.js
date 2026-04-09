const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');
const push = require('../utils/push');

// ─── GET /push/vapid-key — public key for client subscription ─────────────────
router.get('/vapid-key', (req, res) => {
  const key = process.env.PUBLIC_VAPID_KEY;
  if (!key) {
    return res.status(503).json({
      success: false,
      message: 'Push notifications not configured. Set PUBLIC_VAPID_KEY and PRIVATE_VAPID_KEY in .env',
      configured: false,
    });
  }
  res.json({ success: true, publicKey: key, configured: true });
});

// ─── POST /push/subscribe — save a subscription ───────────────────────────────
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { endpoint, keys, deviceName } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data' });
    }

    // Upsert subscription
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user._id,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: req.headers['user-agent'],
        deviceName: deviceName || detectDevice(req.headers['user-agent']),
        isActive: true,
        lastUsed: new Date(),
      },
      { upsert: true, new: true }
    );

    // Send a welcome push
    if (push.isEnabled()) {
      await push.sendPushToUser(req.user._id, push.buildPayload({
        title: '🔔 Notifications Enabled!',
        body: `You'll now get live updates from Technophiles — events, hackathons, live classes and more.`,
        url: '/dashboard',
        tag: 'welcome-push',
      }));
    }

    res.json({ success: true, message: 'Subscribed to push notifications' });
  } catch (err) {
    console.error('[PUSH] Subscribe error:', err);
    res.status(500).json({ success: false, message: 'Failed to save subscription' });
  }
});

// ─── DELETE /push/unsubscribe — remove subscription ──────────────────────────
router.delete('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.findOneAndUpdate({ endpoint, user: req.user._id }, { isActive: false });
    } else {
      // Unsubscribe all devices
      await PushSubscription.updateMany({ user: req.user._id }, { isActive: false });
    }
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ─── GET /push/subscriptions — list user's subscriptions ─────────────────────
router.get('/subscriptions', authenticate, async (req, res) => {
  try {
    const subs = await PushSubscription.find({ user: req.user._id, isActive: true })
      .select('deviceName userAgent lastUsed createdAt')
      .sort({ lastUsed: -1 });
    res.json({ success: true, subscriptions: subs });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ─── POST /push/send-test — test notification (admin) ────────────────────────
router.post('/send-test', authenticate, requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const result = await push.sendPushToUser(req.user._id, push.buildPayload({
      title: '🧪 Test Notification',
      body: 'Push notifications are working correctly on your device!',
      url: '/dashboard',
      tag: 'test-push',
    }));
    res.json({ success: true, ...result, message: push.isEnabled() ? `Sent to ${result.sent} device(s)` : 'Push not configured (missing VAPID keys)' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /push/broadcast — admin broadcast ───────────────────────────────────
router.post('/broadcast', authenticate, requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { title, body, url, target } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: 'Title and body required' });

    const payload = push.buildPayload({ title, body, url: url || '/' });

    let filter = {};
    if (target === 'internal') filter = { role: 'internal' };

    await push.broadcastPush(payload, filter);
    res.json({ success: true, message: 'Broadcast sent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Helper: detect device from UA ───────────────────────────────────────────
function detectDevice(ua = '') {
  if (ua.includes('Android')) return `Android (${ua.includes('Chrome') ? 'Chrome' : 'Browser'})`;
  if (ua.includes('iPhone') || ua.includes('iPad')) return `iOS (${ua.includes('Safari') ? 'Safari' : 'Browser'})`;
  if (ua.includes('Windows')) return `Windows (${ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 'Browser'})`;
  if (ua.includes('Mac')) return `Mac (${ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : 'Browser'})`;
  if (ua.includes('Linux')) return `Linux (Browser)`;
  return 'Unknown Device';
}

module.exports = router;
