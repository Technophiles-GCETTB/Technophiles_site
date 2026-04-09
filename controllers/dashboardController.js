const User = require('../models/User');
const Event = require('../models/Event');
const { Hackathon, Team, Submission } = require('../models/Hackathon');
const { Course, Progress } = require('../models/Course');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const { Attendance, Notification, PointsTransaction } = require('../models/index');

// ─── Main Dashboard Router ────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  const role = req.user.role;

  try {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return await renderAdminDashboard(req, res);
      case 'event_admin':
        return await renderEventAdminDashboard(req, res);
      case 'volunteer':
        return await renderVolunteerDashboard(req, res);
      case 'judge':
        return await renderJudgeDashboard(req, res);
      case 'sponsor':
        return await renderSponsorDashboard(req, res);
      case 'internal':
        return await renderStudentDashboard(req, res);
      case 'external':
        return await renderExternalDashboard(req, res);
      default:
        return res.redirect('/auth/login');
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Error', message: err.message, user: req.user });
  }
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
async function renderAdminDashboard(req, res) {
  const [
    totalUsers, totalEvents, totalHackathons, totalCourses,
    recentUsers, upcomingEvents, recentActivity
  ] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    Hackathon.countDocuments(),
    Course.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
    Event.find({ startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(5),
    PointsTransaction.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name avatar'),
  ]);

  // User stats by role
  const roleStats = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  // Monthly registrations (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyReg = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: {
      _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      count: { $sum: 1 }
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.render('dashboard/admin', {
    title: 'Admin Dashboard - Technophiles',
    stats: { totalUsers, totalEvents, totalHackathons, totalCourses },
    recentUsers, upcomingEvents, recentActivity,
    roleStats, monthlyReg,
    user: req.user
  });
}

// ─── Event Admin Dashboard ────────────────────────────────────────────────────
async function renderEventAdminDashboard(req, res) {
  const myEvents = await Event.find({ 
    $or: [{ createdBy: req.user._id }, { managedBy: req.user._id }] 
  }).sort({ startDate: -1 }).limit(10);

  const totalParticipants = myEvents.reduce((sum, e) => sum + e.participants.length, 0);

  res.render('dashboard/event_admin', {
    title: 'Event Admin Dashboard',
    myEvents, totalParticipants,
    user: req.user
  });
}

// ─── Volunteer Dashboard ──────────────────────────────────────────────────────
async function renderVolunteerDashboard(req, res) {
  const todayEvents = await Event.find({
    startDate: { $lte: new Date(Date.now() + 24*60*60*1000) },
    endDate: { $gte: new Date() }
  }).limit(5);

  const myAttendanceMarked = await Attendance.countDocuments({ markedBy: req.user._id });

  res.render('dashboard/volunteer', {
    title: 'Volunteer Dashboard',
    todayEvents, myAttendanceMarked,
    user: req.user
  });
}

// ─── Judge Dashboard ──────────────────────────────────────────────────────────
async function renderJudgeDashboard(req, res) {
  const myHackathons = await Hackathon.find({ judges: req.user._id });
  const pendingSubmissions = await Submission.find({
    hackathon: { $in: myHackathons.map(h => h._id) },
    'scores.judge': { $nin: [req.user._id] }
  }).populate('team', 'name').limit(10);

  res.render('dashboard/judge', {
    title: 'Judge Dashboard',
    myHackathons, pendingSubmissions,
    user: req.user
  });
}

// ─── Sponsor Dashboard ────────────────────────────────────────────────────────
async function renderSponsorDashboard(req, res) {
  const upcomingEvents = await Event.find({ 
    sponsors: { $exists: true },
    startDate: { $gte: new Date() }
  }).limit(5);

  res.render('dashboard/sponsor', {
    title: 'Sponsor Dashboard',
    upcomingEvents,
    user: req.user
  });
}

// ─── Student (Internal) Dashboard ─────────────────────────────────────────────
async function renderStudentDashboard(req, res) {
  const [
    myProgress, upcomingEvents, recentQuizzes, notifications
  ] = await Promise.all([
    Progress.find({ user: req.user._id }).populate('course', 'title thumbnail category').limit(5),
    Event.find({ 
      status: 'published',
      startDate: { $gte: new Date() }
    }).sort({ startDate: 1 }).limit(5),
    QuizAttempt.find({ user: req.user._id }).populate('quiz', 'title').sort({ createdAt: -1 }).limit(5),
    Notification.find({ recipient: req.user._id, isRead: false }).sort({ createdAt: -1 }).limit(5),
  ]);

  // Leaderboard rank
  const userRank = await User.countDocuments({ points: { $gt: req.user.points } }) + 1;

  // Recent points
  const recentPoints = await PointsTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 }).limit(5);

  res.render('dashboard/student', {
    title: 'My Dashboard - Technophiles',
    myProgress, upcomingEvents, recentQuizzes,
    notifications, userRank, recentPoints,
    user: req.user
  });
}

// ─── External User Dashboard ──────────────────────────────────────────────────
async function renderExternalDashboard(req, res) {
  const publicEvents = await Event.find({
    status: 'published',
    isPublic: true,
    startDate: { $gte: new Date() }
  }).sort({ startDate: 1 }).limit(6);

  const publicHackathons = await Hackathon.find({
    isPublic: true,
    status: { $in: ['upcoming', 'registration_open'] }
  }).limit(4);

  res.render('dashboard/external', {
    title: 'Dashboard - Technophiles',
    publicEvents, publicHackathons,
    user: req.user
  });
}
