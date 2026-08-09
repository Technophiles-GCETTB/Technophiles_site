const mongoose = require('mongoose');

// ─── Module ───────────────────────────────────────────────────────────────────
const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, required: true },
  type: {
    type: String,
    enum: ['video', 'article', 'quiz', 'assignment', 'live'],
    default: 'video'
  },
  content: {
    videoUrl: String,
    videoId: String, // YouTube/Vimeo ID
    duration: Number, // in minutes
    article: String, // HTML content
    resources: [{
      title: String,
      url: String,
      type: String // pdf, link, doc
    }]
  },
  isPreview: { type: Boolean, default: false },
  pointsReward: { type: Number, default: 5 },
}, { timestamps: true });

// ─── Course ───────────────────────────────────────────────────────────────────
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, default: '/images/course-default.jpg' },
  category: {
    type: String,
    enum: ['web_dev', 'dsa', 'ai_ml', 'cybersecurity', 'mobile', 'cloud', 'blockchain', 'other'],
    default: 'other'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [String],
  prerequisites: [String],
  learningOutcomes: [String],
  estimatedDuration: { type: Number }, // hours
  pointsReward: { type: Number, default: 50 },
  isFree: { type: Boolean, default: true },
  price: { type: Number, default: 0 },

  // Access: only internal users or all
  accessLevel: {
    type: String,
    enum: ['internal_only', 'all'],
    default: 'internal_only'
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
  enrolledCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  // Linked events and live classes
  linkedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  linkedLiveClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass' }],
}, { timestamps: true });

// ─── Course Progress ──────────────────────────────────────────────────────────
const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  currentModule: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  progressPercent: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: Date,
  pointsEarned: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

progressSchema.index({ user: 1, course: 1 }, { unique: true });

// ─── Roadmap ──────────────────────────────────────────────────────────────────
const roadmapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  icon: { type: String },
  color: { type: String, default: '#39FF14' },
  steps: [{
    order: Number,
    title: String,
    description: String,
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    resources: [{
      title: String,
      url: String
    }],
    isOptional: { type: Boolean, default: false }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Module = mongoose.model('Module', moduleSchema);
const Course = mongoose.model('Course', courseSchema);
const Progress = mongoose.model('Progress', progressSchema);
const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = { Module, Course, Progress, Roadmap };
