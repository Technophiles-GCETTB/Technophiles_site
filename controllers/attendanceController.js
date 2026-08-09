const { Attendance, PointsTransaction, Notification } = require('../models/index');
const Event = require('../models/Event');
const User = require('../models/User');

// ─── Scan QR Code ─────────────────────────────────────────────────────────────
exports.scanQR = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const event = await Event.findOne({ qrCode: qrToken });

    if (!event) {
      return res.render('attendance/scan-result', {
        title: 'QR Scan',
        success: false,
        message: 'Invalid QR code.',
        user: req.user
      });
    }

    // Check if user registered
    const isRegistered = event.participants.some(p => p.user.toString() === req.user._id.toString());
    if (!isRegistered) {
      return res.render('attendance/scan-result', {
        title: 'QR Scan',
        success: false,
        message: 'You are not registered for this event.',
        event, user: req.user
      });
    }

    // Check if already attended
    const existing = await Attendance.findOne({ event: event._id, user: req.user._id });
    if (existing) {
      return res.render('attendance/scan-result', {
        title: 'QR Scan',
        success: true,
        message: 'Attendance already marked!',
        event, user: req.user
      });
    }

    // Mark attendance
    await Attendance.create({
      event: event._id,
      user: req.user._id,
      markedBy: req.user._id,
      method: 'self'
    });

    // Mark in event participants
    await Event.updateOne(
      { _id: event._id, 'participants.user': req.user._id },
      { $set: { 'participants.$.attended': true, 'participants.$.attendedAt': new Date() } }
    );

    // Award points
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: event.pointsReward } });
    await PointsTransaction.create({
      user: req.user._id,
      points: event.pointsReward,
      type: 'event_attendance',
      description: `Attended: ${event.title}`,
      reference: event._id,
      referenceModel: 'Event'
    });

    res.render('attendance/scan-result', {
      title: 'Attendance Marked',
      success: true,
      message: `✅ Attendance marked for "${event.title}"! +${event.pointsReward} points`,
      event, user: req.user
    });
  } catch (err) {
    console.error(err);
    res.render('attendance/scan-result', {
      title: 'QR Scan',
      success: false,
      message: 'Something went wrong. Please try again.',
      user: req.user
    });
  }
};

// ─── Manual Attendance ────────────────────────────────────────────────────────
exports.markManual = async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.redirect('/attendance');

    const existing = await Attendance.findOne({ event: eventId, user: userId });
    if (!existing) {
      await Attendance.create({
        event: eventId,
        user: userId,
        markedBy: req.user._id,
        method: 'manual'
      });

      await Event.updateOne(
        { _id: eventId, 'participants.user': userId },
        { $set: { 'participants.$.attended': true, 'participants.$.attendedAt': new Date() } }
      );

      await User.findByIdAndUpdate(userId, { $inc: { points: event.pointsReward } });
    }

    res.redirect(`/events/${eventId}/participants?msg=marked`);
  } catch (err) {
    console.error(err);
    res.redirect('/attendance');
  }
};

// ─── Volunteer Attendance Panel ───────────────────────────────────────────────
exports.getVolunteerPanel = async (req, res) => {
  try {
    const events = await Event.find({
      startDate: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      endDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.render('attendance/volunteer', {
      title: 'Attendance Panel',
      events, user: req.user
    });
  } catch (err) {
    res.redirect('/dashboard');
  }
};

// ─── My Attendance ────────────────────────────────────────────────────────────
exports.getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.user._id })
      .populate('event', 'title startDate type pointsReward')
      .sort({ markedAt: -1 });

    const total = await Event.countDocuments({
      'participants.user': req.user._id
    });

    const attended = records.length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    res.render('attendance/my-attendance', {
      title: 'My Attendance',
      records, total, attended, percentage,
      user: req.user
    });
  } catch (err) {
    res.redirect('/dashboard');
  }
};
