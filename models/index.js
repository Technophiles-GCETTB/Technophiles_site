const mongoose = require('mongoose');

// ─── Attendance ───────────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // volunteer/admin
  method: {
    type: String,
    enum: ['qr_scan', 'manual', 'self'],
    default: 'qr_scan'
  },
  markedAt: { type: Date, default: Date.now },
  notes: String,
}, { timestamps: true });

attendanceSchema.index({ event: 1, user: 1 }, { unique: true, sparse: true });

// ─── Sponsor ──────────────────────────────────────────────────────────────────
const sponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  website: { type: String },
  description: { type: String },
  tier: {
    type: String,
    enum: ['title', 'platinum', 'gold', 'silver', 'bronze', 'community'],
    default: 'silver'
  },
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  amount: { type: Number },
  benefits: [String],
  isActive: { type: Boolean, default: true },
  linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  hackathons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' }],
}, { timestamps: true });

// ─── Activity Log ─────────────────────────────────────────────────────────────
const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String }, // 'Event', 'User', 'Course', etc.
  entityId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: String,
  userAgent: String,
}, { timestamps: true });

// ─── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['event_reminder', 'hackathon_update', 'course_update', 'quiz_result', 
           'badge_earned', 'rank_change', 'system', 'announcement'],
    default: 'system'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

// ─── Points Transaction ───────────────────────────────────────────────────────
const pointsTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true },
  type: {
    type: String,
    enum: ['event_attendance', 'course_completion', 'module_completion', 
           'quiz_completion', 'hackathon_participation', 'hackathon_win', 
           'badge_earned', 'manual_award', 'penalty'],
    required: true
  },
  description: String,
  reference: { type: mongoose.Schema.Types.ObjectId },
  referenceModel: String,
  balance: { type: Number }, // running balance
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
const Sponsor = mongoose.model('Sponsor', sponsorSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);

module.exports = { Attendance, Sponsor, ActivityLog, Notification, PointsTransaction };
