const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['workshop', 'seminar', 'webinar', 'competition', 'meetup', 'live_class', 'other'],
    default: 'workshop'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  banner: { type: String, default: '/images/event-default.jpg' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  venue: { type: String },
  isVirtual: { type: Boolean, default: false },
  meetingLink: { type: String },
  maxParticipants: { type: Number, default: 100 },
  registrationDeadline: { type: Date },
  tags: [String],
  pointsReward: { type: Number, default: 10 },

  // QR Code for attendance
  qrCode: { type: String, default: () => uuidv4() },
  qrCodeImage: { type: String },

  // Access Control
  isPublic: { type: Boolean, default: true }, // External users can register
  allowedRoles: [{ type: String }],

  // Relations
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registeredAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false },
    attendedAt: Date,
    certificateIssued: { type: Boolean, default: false },
  }],

  // Certificate
  certificateTemplate: { type: String },
  
  // Sponsors for event
  sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }],

  // Live class fields
  recordingLink: { type: String },
}, { timestamps: true });

// Virtual: participant count
eventSchema.virtual('participantCount').get(function () {
  return this.participants.length;
});

// Virtual: is full
eventSchema.virtual('isFull').get(function () {
  return this.participants.length >= this.maxParticipants;
});

module.exports = mongoose.model('Event', eventSchema);
