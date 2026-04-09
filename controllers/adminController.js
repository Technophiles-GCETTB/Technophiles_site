const User = require('../models/User');
const Event = require('../models/Event');
const { Hackathon } = require('../models/Hackathon');
const { Course } = require('../models/Course');
const { Sponsor, ActivityLog, Notification, PointsTransaction } = require('../models/index');
const { ROLES } = require('../config/roles');

// ─── User Management ──────────────────────────────────────────────────────────
exports.listUsers = async (req, res) => {
  try {
    const { role, search, page = 1 } = req.query;
    const limit = 20;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('admin/users', {
      title: 'Manage Users',
      users, roles: Object.values(ROLES),
      filters: { role, search },
      pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit), limit },
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);

    // Superadmin protection
    if (targetUser.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.redirect('/admin/users?msg=unauthorized');
    }

    await User.findByIdAndUpdate(req.params.id, { role });

    await ActivityLog.create({
      user: req.user._id,
      action: 'USER_ROLE_UPDATED',
      entity: 'User',
      entityId: req.params.id,
      details: { oldRole: targetUser.role, newRole: role }
    });

    res.redirect('/admin/users?msg=role_updated');
  } catch (err) {
    res.redirect('/admin/users');
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    await User.findByIdAndUpdate(req.params.id, { isActive: !targetUser.isActive });

    await ActivityLog.create({
      user: req.user._id,
      action: targetUser.isActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
      entity: 'User',
      entityId: req.params.id
    });

    res.redirect('/admin/users');
  } catch (err) {
    res.redirect('/admin/users');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.redirect('/admin/users?msg=unauthorized');
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    res.redirect('/admin/users');
  }
};

// ─── Award Points ─────────────────────────────────────────────────────────────
exports.awardPoints = async (req, res) => {
  try {
    const { userId, points, description } = req.body;
    const pts = parseInt(points);

    await User.findByIdAndUpdate(userId, { $inc: { points: pts } });
    await PointsTransaction.create({
      user: userId,
      points: pts,
      type: 'manual_award',
      description: description || 'Manual points award by admin'
    });

    await Notification.create({
      recipient: userId,
      type: 'badge_earned',
      title: `${pts > 0 ? '🎉' : '⚠️'} Points ${pts > 0 ? 'Awarded' : 'Deducted'}`,
      message: `${Math.abs(pts)} points ${pts > 0 ? 'awarded' : 'deducted'}: ${description}`
    });

    res.redirect('/admin/users?msg=points_awarded');
  } catch (err) {
    res.redirect('/admin/users');
  }
};

// ─── Activity Logs ────────────────────────────────────────────────────────────
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 30;
    const total = await ActivityLog.countDocuments();
    const logs = await ActivityLog.find()
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('admin/activity', {
      title: 'Activity Logs',
      logs,
      pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) },
      user: req.user
    });
  } catch (err) {
    res.redirect('/admin');
  }
};

// ─── Send Notification ─────────────────────────────────────────────────────────
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type, target, link } = req.body;

    let recipients = [];
    if (target === 'all') {
      const users = await User.find({}, '_id');
      recipients = users.map(u => u._id);
    } else if (target === 'internal') {
      const users = await User.find({ role: 'internal' }, '_id');
      recipients = users.map(u => u._id);
    } else if (target === 'specific') {
      const { recipientId } = req.body;
      recipients = [recipientId];
    }

    const notifications = recipients.map(r => ({
      recipient: r, type: type || 'announcement', title, message, link
    }));

    await Notification.insertMany(notifications);
    res.redirect('/admin?msg=notifications_sent');
  } catch (err) {
    res.redirect('/admin');
  }
};

// ─── System Stats ─────────────────────────────────────────────────────────────
exports.getSystemStats = async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalHackathons, totalCourses] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Hackathon.countDocuments(),
      Course.countDocuments()
    ]);

    const roleStats = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    const topUsers = await User.find().sort({ points: -1 }).limit(10).select('name email points role avatar');

    res.render('admin/system', {
      title: 'System Stats',
      stats: { totalUsers, totalEvents, totalHackathons, totalCourses },
      roleStats, topUsers, user: req.user
    });
  } catch (err) {
    res.redirect('/admin');
  }
};
