/**
 * Web Push Notification Utility
 * Uses VAPID keys for authentication (Web Push Protocol)
 *
 * Setup:
 *   1. Run once: node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k))"
 *   2. Copy the output PUBLIC_VAPID_KEY and PRIVATE_VAPID_KEY into .env
 */

let webpush;
try {
  webpush = require('web-push');
} catch (e) {
  console.warn('[PUSH] web-push not installed. Run: npm install web-push');
  webpush = null;
}

const PushSubscription = require('../models/PushSubscription');

// ─── Configure VAPID ──────────────────────────────────────────────────────────
function initWebPush() {
  if (!webpush) return false;
  const publicKey = process.env.PUBLIC_VAPID_KEY;
  const privateKey = process.env.PRIVATE_VAPID_KEY;
  const email = process.env.VAPID_EMAIL || `mailto:${process.env.EMAIL_USER || 'admin@technophiles.com'}`;

  if (!publicKey || !privateKey) {
    console.warn('[PUSH] VAPID keys not set. Browser push notifications disabled.');
    console.warn('[PUSH] Generate keys: node -e "const wp=require(\'web-push\'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"');
    return false;
  }

  try {
    webpush.setVapidDetails(email, publicKey, privateKey);
    return true;
  } catch (e) {
    console.error('[PUSH] VAPID init error:', e.message);
    return false;
  }
}

const isEnabled = initWebPush();

// ─── Send Push to One User ────────────────────────────────────────────────────
async function sendPushToUser(userId, payload) {
  if (!webpush || !isEnabled) return { sent: 0, failed: 0 };

  const subscriptions = await PushSubscription.find({ user: userId, isActive: true });
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const results = await Promise.allSettled(
    subscriptions.map(sub => sendToSubscription(sub, payload))
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  return { sent, failed };
}

// ─── Send Push to Multiple Users ─────────────────────────────────────────────
async function sendPushToUsers(userIds, payload) {
  if (!webpush || !isEnabled) return;
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushToUser(userId, payload))
  );
  const totalSent = results.reduce((sum, r) => sum + (r.value?.sent || 0), 0);
  console.log(`[PUSH] Sent to ${totalSent} devices for ${userIds.length} users`);
}

// ─── Broadcast Push to All Users ─────────────────────────────────────────────
async function broadcastPush(payload, filter = {}) {
  if (!webpush || !isEnabled) return;
  const User = require('../models/User');
  const users = await User.find({ isActive: true, ...filter }, '_id');
  const userIds = users.map(u => u._id);
  await sendPushToUsers(userIds, payload);
}

// ─── Internal: Send to One Subscription ──────────────────────────────────────
async function sendToSubscription(sub, payload) {
  const pushPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      pushPayload,
      { TTL: 60 * 60 * 24 } // 24 hour TTL
    );
    // Update lastUsed
    await PushSubscription.findByIdAndUpdate(sub._id, { lastUsed: new Date() });
    return { success: true };
  } catch (err) {
    // 410 Gone = subscription expired, deactivate it
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.findByIdAndUpdate(sub._id, { isActive: false });
    }
    throw err;
  }
}

// ─── Build Notification Payload ───────────────────────────────────────────────
function buildPayload(opts) {
  const {
    title = 'Technophiles',
    body,
    url = '/',
    tag,
    icon = '/icons/icon-192.png',
    image,
    requireInteraction = false,
    actions,
    notificationId,
  } = opts;

  return {
    title,
    body,
    url,
    tag: tag || `technophiles-${Date.now()}`,
    icon,
    image,
    requireInteraction,
    actions: actions || [
      { action: 'open', title: '👁 View' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
    notificationId,
    timestamp: Date.now(),
  };
}

// ─── Convenience: Send event notification ────────────────────────────────────
async function notifyEventStart(event, userIds) {
  const payload = buildPayload({
    title: `📅 ${event.title} — Starting Soon!`,
    body: `Your registered event starts in 30 minutes. ${event.isVirtual ? 'Join online.' : `Venue: ${event.venue || 'On campus'}`}`,
    url: `/events/${event._id}`,
    tag: `event-${event._id}`,
    requireInteraction: true,
  });
  await sendPushToUsers(userIds, payload);
}

async function notifyLiveClassStart(liveClass, userIds) {
  const payload = buildPayload({
    title: `🔴 Live Now: ${liveClass.title}`,
    body: `Your live class is starting! Click to join.`,
    url: `/live-classes/${liveClass._id}`,
    tag: `live-${liveClass._id}`,
    requireInteraction: true,
    actions: [
      { action: 'open', title: '🎥 Join Now' },
      { action: 'dismiss', title: 'Later' },
    ],
  });
  await sendPushToUsers(userIds, payload);
}

async function notifyHackathonDeadline(hackathon, userIds) {
  const payload = buildPayload({
    title: `⚡ ${hackathon.title} — Deadline Soon!`,
    body: `Submission deadline in 1 hour. Don't miss it!`,
    url: `/hackathons/${hackathon._id}`,
    tag: `hackathon-deadline-${hackathon._id}`,
    requireInteraction: true,
  });
  await sendPushToUsers(userIds, payload);
}

async function notifyNewEvent(event) {
  const User = require('../models/User');
  const users = await User.find({ isActive: true, role: { $in: ['internal', 'admin', 'superadmin'] } }, '_id');
  const payload = buildPayload({
    title: `📣 New Event: ${event.title}`,
    body: `Register now — ${new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${event.venue || 'Online'}`,
    url: `/events/${event._id}`,
    tag: `new-event-${event._id}`,
  });
  await sendPushToUsers(users.map(u => u._id), payload);
}

module.exports = {
  isEnabled: () => isEnabled,
  sendPushToUser,
  sendPushToUsers,
  broadcastPush,
  buildPayload,
  notifyEventStart,
  notifyLiveClassStart,
  notifyHackathonDeadline,
  notifyNewEvent,
};
