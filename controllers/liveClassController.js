const { LiveClass } = require('../models/extras');
const { Notification } = require('../models/index');
const User = require('../models/User');
const { awardPoints } = require('../utils/points');

// ─── List Live Classes ────────────────────────────────────────────────────────
exports.listLiveClasses = async (req, res) => {
  try {
    const now = new Date();
    const upcoming = await LiveClass.find({ scheduledAt: { $gte: now }, status: { $in: ['scheduled', 'live'] } })
      .populate('instructor', 'name avatar').sort({ scheduledAt: 1 }).limit(20);
    const past = await LiveClass.find({ status: 'completed' })
      .populate('instructor', 'name avatar').sort({ scheduledAt: -1 }).limit(20);
    res.render('live-classes/list', { title: 'Live Classes', upcoming, past, user: req.user });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

// ─── Get Single Live Class ────────────────────────────────────────────────────
exports.getLiveClass = async (req, res) => {
  try {
    const lc = await LiveClass.findById(req.params.id)
      .populate('instructor', 'name avatar bio')
      .populate('course', 'title');
    if (!lc) return res.status(404).render('404', { title: '404' });
    const isRegistered = req.user && lc.registeredUsers.map(u => u.toString()).includes(req.user._id.toString());
    res.render('live-classes/detail', { title: lc.title, lc, isRegistered, user: req.user });
  } catch (err) {
    res.redirect('/live-classes');
  }
};

// ─── Create Live Class (GET) ──────────────────────────────────────────────────
exports.getCreate = async (req, res) => {
  const { Course } = require('../models/Course');
  const courses = await Course.find({ status: 'published' }, 'title');
  res.render('live-classes/create', { title: 'Schedule Live Class', lc: null, courses, user: req.user });
};

// ─── Create Live Class (POST) ─────────────────────────────────────────────────
exports.createLiveClass = async (req, res) => {
  try {
    const { title, description, course, scheduledAt, endAt, duration, meetingLink, meetingId, meetingPassword, platform, isPublic, pointsReward } = req.body;
    const lc = await LiveClass.create({
      title, description,
      course: course || undefined,
      scheduledAt: new Date(scheduledAt),
      endAt: endAt ? new Date(endAt) : undefined,
      duration: parseInt(duration) || 60,
      meetingLink, meetingId, meetingPassword,
      platform: platform || 'google_meet',
      isPublic: isPublic === 'on',
      pointsReward: parseInt(pointsReward) || 15,
      instructor: req.user._id,
      createdBy: req.user._id,
    });
    res.redirect(`/live-classes/${lc._id}`);
  } catch (err) {
    console.error(err);
    const { Course } = require('../models/Course');
    const courses = await Course.find({ status: 'published' }, 'title');
    res.render('live-classes/create', { title: 'Schedule Live Class', lc: req.body, courses, error: err.message, user: req.user });
  }
};

// ─── Edit Live Class (GET) ────────────────────────────────────────────────────
exports.getEdit = async (req, res) => {
  try {
    const lc = await LiveClass.findById(req.params.id);
    const { Course } = require('../models/Course');
    const courses = await Course.find({ status: 'published' }, 'title');
    res.render('live-classes/create', { title: 'Edit Live Class', lc, courses, user: req.user });
  } catch (err) {
    res.redirect('/live-classes');
  }
};

// ─── Update Live Class (PUT) ──────────────────────────────────────────────────
exports.updateLiveClass = async (req, res) => {
  try {
    const { title, description, course, scheduledAt, endAt, duration, meetingLink, meetingId, meetingPassword, platform, recordingLink, notes, status, isPublic, pointsReward } = req.body;
    await LiveClass.findByIdAndUpdate(req.params.id, {
      title, description,
      course: course || undefined,
      scheduledAt: new Date(scheduledAt),
      endAt: endAt ? new Date(endAt) : undefined,
      duration: parseInt(duration) || 60,
      meetingLink, meetingId, meetingPassword, platform,
      recordingLink, notes,
      status,
      isPublic: isPublic === 'on',
      pointsReward: parseInt(pointsReward) || 15,
    });
    res.redirect(`/live-classes/${req.params.id}`);
  } catch (err) {
    res.redirect(`/live-classes/${req.params.id}/edit`);
  }
};

// ─── Delete Live Class ────────────────────────────────────────────────────────
exports.deleteLiveClass = async (req, res) => {
  try {
    await LiveClass.findByIdAndDelete(req.params.id);
    res.redirect('/live-classes');
  } catch (err) {
    res.redirect('/live-classes');
  }
};

// ─── Register for Live Class ──────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const lc = await LiveClass.findById(req.params.id);
    if (!lc.registeredUsers.includes(req.user._id)) {
      lc.registeredUsers.push(req.user._id);
      await lc.save();
    }
    res.redirect(`/live-classes/${lc._id}?msg=registered`);
  } catch (err) {
    res.redirect(`/live-classes/${req.params.id}`);
  }
};

// ─── Send "Starting Now" Notification ────────────────────────────────────────
exports.sendStartNotification = async (req, res) => {
  try {
    const lc = await LiveClass.findById(req.params.id);
    if (!lc) return res.status(404).json({ success: false });

    // Mark as live
    lc.status = 'live';
    lc.notificationSent = true;
    await lc.save();

    // Notify all registered users (in-app + push)
    const notifications = lc.registeredUsers.map(userId => ({
      recipient: userId,
      type: 'event_reminder',
      title: `🔴 Live Now: ${lc.title}`,
      message: `Your live class is starting now! Click to join.`,
      link: `/live-classes/${lc._id}`,
    }));
    if (notifications.length > 0) {
      const { Notification } = require('../models/index');
      await Notification.insertMany(notifications);
    }

    // Send browser push notifications
    try {
      const push = require('../utils/push');
      if (push.isEnabled()) {
        await push.notifyLiveClassStart(lc, lc.registeredUsers);
      }
    } catch (pushErr) {
      console.warn('[PUSH] Live class push failed:', pushErr.message);
    }

    res.json({ success: true, message: `Notified ${lc.registeredUsers.length} students` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Add Notes / Recording after class ───────────────────────────────────────
exports.updatePostClass = async (req, res) => {
  try {
    const { recordingLink, notes, status } = req.body;
    const lc = await LiveClass.findByIdAndUpdate(req.params.id, {
      recordingLink, notes,
      status: status || 'completed',
    }, { new: true });

    // Notify attendees that recording is available
    if (recordingLink && lc.attendees.length > 0) {
      const { Notification } = require('../models/index');
      const notifs = lc.attendees.map(userId => ({
        recipient: userId,
        type: 'course_update',
        title: `📹 Recording Available: ${lc.title}`,
        message: 'The recording for the live class you attended is now available.',
        link: `/live-classes/${lc._id}`,
      }));
      await Notification.insertMany(notifs);
    }

    res.redirect(`/live-classes/${req.params.id}`);
  } catch (err) {
    res.redirect(`/live-classes/${req.params.id}`);
  }
};

// ─── Mark Attendance for Live Class ──────────────────────────────────────────
exports.markAttendance = async (req, res) => {
  try {
    const lc = await LiveClass.findById(req.params.id);
    if (!lc.attendees.includes(req.user._id)) {
      lc.attendees.push(req.user._id);
      await lc.save();
      // Award points
      await awardPoints({
        userId: req.user._id,
        points: lc.pointsReward,
        type: 'event_attendance',
        description: `Attended live class: ${lc.title}`,
        reference: lc._id,
        referenceModel: 'LiveClass',
      });
    }
    res.redirect(`/live-classes/${lc._id}?msg=attended`);
  } catch (err) {
    res.redirect(`/live-classes/${req.params.id}`);
  }
};
