const mongoose = require('mongoose');

// ─── Hackathon ────────────────────────────────────────────────────────────────
const hackathonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tagline: { type: String },
  description: { type: String, required: true },
  problemStatements: [{
    title: String,
    description: String,
    domain: String
  }],
  status: {
    type: String,
    enum: ['upcoming', 'registration_open', 'ongoing', 'judging', 'completed'],
    default: 'upcoming'
  },
  banner: { type: String, default: '/images/hackathon-default.jpg' },
  registrationStart: { type: Date },
  registrationEnd: { type: Date },
  hackathonStart: { type: Date, required: true },
  hackathonEnd: { type: Date, required: true },
  submissionDeadline: { type: Date },
  venue: { type: String },
  isVirtual: { type: Boolean, default: false },
  meetingLink: { type: String },
  maxTeamSize: { type: Number, default: 4 },
  minTeamSize: { type: Number, default: 1 },
  maxTeams: { type: Number, default: 50 },
  prizes: [{
    position: String,
    amount: String,
    description: String
  }],
  rules: [String],
  techStack: [String],
  pointsReward: { type: Number, default: 100 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  judges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }],
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

// ─── Team ─────────────────────────────────────────────────────────────────────
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  inviteCode: { type: String, unique: true },
  problemStatement: { type: String },
  status: {
    type: String,
    enum: ['forming', 'complete', 'submitted', 'disqualified'],
    default: 'forming'
  },
}, { timestamps: true });

// ─── Submission ───────────────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  projectTitle: { type: String, required: true },
  description: { type: String, required: true },
  githubLink: { type: String, required: true },
  demoLink: { type: String },
  presentationLink: { type: String },
  techStack: [String],
  screenshots: [String],
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  scores: [{
    judge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    innovation: { type: Number, min: 0, max: 10 },
    technicality: { type: Number, min: 0, max: 10 },
    impact: { type: Number, min: 0, max: 10 },
    presentation: { type: Number, min: 0, max: 10 },
    total: { type: Number },
    feedback: String,
    scoredAt: { type: Date, default: Date.now }
  }],
  averageScore: { type: Number, default: 0 },
  rank: { type: Number },
}, { timestamps: true });

// Auto-calculate average score
submissionSchema.methods.calculateAverageScore = function () {
  if (this.scores.length === 0) return 0;
  const total = this.scores.reduce((sum, s) => sum + (s.total || 0), 0);
  this.averageScore = total / this.scores.length;
  return this.averageScore;
};

const Hackathon = mongoose.model('Hackathon', hackathonSchema);
const Team = mongoose.model('Team', teamSchema);
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Hackathon, Team, Submission };
