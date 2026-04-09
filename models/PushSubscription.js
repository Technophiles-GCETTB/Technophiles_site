const mongoose = require('mongoose');

// Stores web push subscriptions per user per device
const pushSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String },
  deviceName: { type: String }, // e.g. "Chrome on Android"
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for fast lookup by user
pushSubscriptionSchema.index({ user: 1 });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
module.exports = PushSubscription;
