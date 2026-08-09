/**
 * Unified notification sender
 * Sends both in-app (DB) notification AND browser push notification
 * Drop-in replacement for Notification.create()
 */

const { Notification } = require('../models/index');

// Safe push import — gracefully disabled if web-push not installed
let pushUtil = null;
try {
  pushUtil = require('./push');
} catch (e) {
  // web-push not available
}

/**
 * Send a notification to one user (in-app + optional push)
 * @param {Object} opts
 * @param {string} opts.recipient - User ID
 * @param {string} opts.type
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.link]
 * @param {boolean} [opts.push=true] - also send browser push
 */
async function notify(opts) {
  const { recipient, type, title, message, link, push: sendPush = true } = opts;

  // 1. Save in-app notification
  let inApp;
  try {
    inApp = await Notification.create({ recipient, type, title, message, link });
  } catch (err) {
    console.error('[NOTIFY] In-app save failed:', err.message);
  }

  // 2. Browser push
  if (sendPush && pushUtil && pushUtil.isEnabled()) {
    try {
      await pushUtil.sendPushToUser(recipient, pushUtil.buildPayload({
        title,
        body: message,
        url: link || '/dashboard',
        tag: type,
        notificationId: inApp?._id?.toString(),
      }));
    } catch (err) {
      // Push failure should not crash the main flow
      console.warn('[NOTIFY] Push failed:', err.message);
    }
  }

  return inApp;
}

/**
 * Send notification to multiple users
 */
async function notifyMany(recipients, opts) {
  const { type, title, message, link, push: sendPush = true } = opts;

  // Bulk insert in-app notifications
  try {
    await Notification.insertMany(
      recipients.map(r => ({ recipient: r, type, title, message, link }))
    );
  } catch (err) {
    console.error('[NOTIFY] Bulk in-app save failed:', err.message);
  }

  // Push to all
  if (sendPush && pushUtil && pushUtil.isEnabled()) {
    await pushUtil.sendPushToUsers(recipients, pushUtil.buildPayload({
      title, body: message, url: link || '/dashboard', tag: type,
    }));
  }
}

module.exports = { notify, notifyMany };
