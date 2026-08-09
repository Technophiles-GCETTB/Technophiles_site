const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ROLES, ROLE_PERMISSIONS } = require('../config/roles');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.EXTERNAL
  },
  // Profile
  avatar: { type: String, default: '/images/default-avatar.png' },
  bio: { type: String, maxlength: 500 },
  phone: { type: String },
  college: { type: String },
  branch: { type: String },
  year: { type: Number, min: 1, max: 6 },
  rollNumber: { type: String },
  github: { type: String },
  linkedin: { type: String },

  // Points & Gamification
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  rank: { type: Number },

  // Auth
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,

  // Relations
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Virtual: permissions ─────────────────────────────────────────────────────
userSchema.virtual('permissions').get(function () {
  return ROLE_PERMISSIONS[this.role] || [];
});

// ─── Pre-save: Hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Method: Compare password ─────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: Generate JWT ─────────────────────────────────────────────────────
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ─── Method: Has Permission ───────────────────────────────────────────────────
userSchema.methods.hasPermission = function (permission) {
  const perms = ROLE_PERMISSIONS[this.role] || [];
  return perms.includes(permission);
};

// ─── Method: Assign auto role from email ─────────────────────────────────────
userSchema.statics.getRoleFromEmail = function (email) {
  const domain = process.env.COLLEGE_EMAIL_DOMAIN || 'gcettb.ac.in';
  return email.endsWith(`@${domain}`) ? ROLES.INTERNAL : ROLES.EXTERNAL;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
