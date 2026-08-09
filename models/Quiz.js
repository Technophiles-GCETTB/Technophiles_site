const mongoose = require('mongoose');

// ─── Question ─────────────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  explanation: { type: String },
  marks: { type: Number, default: 1 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [String]
});

// ─── Quiz ─────────────────────────────────────────────────────────────────────
const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  questions: [questionSchema],
  duration: { type: Number, default: 30 }, // minutes
  totalMarks: { type: Number, default: 0 },
  passingMarks: { type: Number, default: 0 },
  shuffleQuestions: { type: Boolean, default: true },
  shuffleOptions: { type: Boolean, default: true },
  showResultImmediately: { type: Boolean, default: true },
  maxAttempts: { type: Number, default: 1 },
  startTime: { type: Date },
  endTime: { type: Date },
  pointsReward: { type: Number, default: 20 },
  accessLevel: {
    type: String,
    enum: ['internal_only', 'all'],
    default: 'internal_only'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed'],
    default: 'draft'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Auto-calculate total marks
quizSchema.pre('save', function (next) {
  this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  if (!this.passingMarks) {
    this.passingMarks = Math.ceil(this.totalMarks * 0.4); // 40% passing
  }
  next();
});

// ─── Quiz Attempt ─────────────────────────────────────────────────────────────
const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    question: mongoose.Schema.Types.ObjectId,
    selectedOption: Number,
    isCorrect: Boolean,
    marksObtained: Number
  }],
  totalScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  isPassed: { type: Boolean, default: false },
  timeTaken: { type: Number }, // seconds
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  pointsEarned: { type: Number, default: 0 },
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = { Quiz, QuizAttempt };
