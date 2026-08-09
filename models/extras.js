const mongoose = require('mongoose');

// ─── Live Class ───────────────────────────────────────────────────────────────
const liveClassSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  scheduledAt: { type: Date, required: true },
  endAt: { type: Date },
  duration: { type: Number, default: 60 }, // minutes
  meetingLink: { type: String }, // Google Meet / Zoom
  meetingId: { type: String },
  meetingPassword: { type: String },
  platform: { type: String, enum: ['google_meet', 'zoom', 'teams', 'other'], default: 'google_meet' },
  recordingLink: { type: String }, // YouTube link after class
  notes: { type: String }, // HTML notes from the class
  attachments: [{ title: String, url: String, type: String }],
  status: { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' },
  isPublic: { type: Boolean, default: false },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pointsReward: { type: Number, default: 15 },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notificationSent: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Club Member ──────────────────────────────────────────────────────────────
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  post: { type: String, required: true, trim: true }, // President, Vice President, etc.
  department: { type: String },
  year: { type: String },
  image: { type: String, default: '/images/default-avatar.png' },
  bio: { type: String },
  email: { type: String },
  github: { type: String },
  linkedin: { type: String },
  instagram: { type: String },
  order: { type: Number, default: 99 }, // display order
  category: {
    type: String,
    enum: ['core', 'technical', 'creative', 'management', 'faculty', 'alumni'],
    default: 'core'
  },
  isActive: { type: Boolean, default: true },
  linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joinedYear: { type: String },
  batch: { type: String },
  achievements: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Certificate Template ─────────────────────────────────────────────────────
const certTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['participation', 'completion', 'winner_1st', 'winner_2nd', 'winner_3rd', 'custom'],
    required: true
  },
  // Uploaded custom design image (Google Drive or any direct URL)
  backgroundImage: { type: String, default: '' },
  // Which specific entities this template is assigned to (optional)
  appliesTo: [{
    entityType: { type: String, enum: ['event', 'hackathon', 'quiz', 'course', 'all'] },
    entityId: { type: mongoose.Schema.Types.ObjectId },
  }],
  // Text overlay field positions
  fields: [{
    key: String,       // 'participant_name', 'event_title', 'date'
    label: String,
    x: Number,         // % from left  (0-100)
    y: Number,         // % from top   (0-100)
    fontSize: Number,  // px
    fontColor: String,
    align: String,     // 'center', 'left', 'right'
    fontWeight: String, // '400', '600', '700', '900'
  }],
  isDefault: { type: Boolean, default: false },
  previewUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Page Content (About / Contact) ──────────────────────────────────────────
const pageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, // 'about', 'contact'
  title: { type: String, required: true },
  content: { type: String }, // HTML rich content
  // About page specific
  mission: { type: String },
  vision: { type: String },
  founded: { type: String },
  collegeAffiliation: { type: String },
  stats: [{
    label: String,
    value: String,
    icon: String,
  }],
  socialLinks: {
    github: String,
    linkedin: String,
    instagram: String,
    twitter: String,
    youtube: String,
    discord: String,
    website: String,
  },
  // Contact page specific
  contactEmail: { type: String },
  contactPhone: { type: String },
  address: { type: String },
  mapEmbedUrl: { type: String },
  faqs: [{
    question: String,
    answer: String,
  }],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Contact Message ──────────────────────────────────────────────────────────
const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  repliedAt: Date,
  reply: String,
  ip: String,
}, { timestamps: true });

// ─── Assignment ───────────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  dueDate: { type: Date },
  maxScore: { type: Number, default: 100 },
  pointsReward: { type: Number, default: 20 },
  instructions: { type: String },
  attachments: [{ title: String, url: String }],
  submissionType: {
    type: String,
    enum: ['link', 'text', 'file', 'github'],
    default: 'link'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String }, // link, text, or file URL
  notes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  score: { type: Number },
  feedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
}, { timestamps: true });

// ─── Project Showcase ─────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  longDescription: { type: String },
  techStack: [String],
  category: {
    type: String,
    enum: ['web', 'mobile', 'ai_ml', 'iot', 'game', 'tool', 'blockchain', 'other'],
    default: 'web'
  },
  thumbnail: { type: String, default: '/images/project-default.jpg' },
  images: [String],
  githubLink: { type: String },
  liveLink: { type: String },
  demoVideo: { type: String }, // YouTube URL
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  authorNames: [String], // for non-registered authors
  status: { type: String, enum: ['draft', 'published', 'featured'], default: 'published' },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  tags: [String],
  submittedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

const LiveClass = mongoose.model('LiveClass', liveClassSchema);
const Member = mongoose.model('Member', memberSchema);
const CertTemplate = mongoose.model('CertTemplate', certTemplateSchema);
const Page = mongoose.model('Page', pageSchema);
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);

module.exports = { LiveClass, Member, CertTemplate, Page, ContactMessage, Assignment, AssignmentSubmission, Project };
