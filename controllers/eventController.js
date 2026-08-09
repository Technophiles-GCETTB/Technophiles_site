const Event = require('../models/Event');
const { Attendance, Notification, PointsTransaction, ActivityLog } = require('../models/index');
const User = require('../models/User');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// ─── GET /events ──────────────────────────────────────────────────────────────
exports.listEvents = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filter = {};
    
    // External users only see public events
    if (!req.user || req.user.role === 'external') {
      filter.isPublic = true;
      filter.status = 'published';
    }
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const events = await Event.find(filter)
      .populate('createdBy', 'name')
      .sort({ startDate: 1 });

    res.render('events/list', {
      title: 'Events - Technophiles',
      events, filters: { type, status, search },
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

// ─── GET /events/:id ──────────────────────────────────────────────────────────
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('participants.user', 'name avatar email');

    if (!event) return res.status(404).render('404', { title: 'Event Not Found' });

    const isRegistered = req.user && event.participants.some(p => 
      p.user && p.user._id.toString() === req.user._id.toString()
    );

    res.render('events/detail', {
      title: `${event.title} - Technophiles`,
      event, isRegistered, user: req.user, query: req.query
    });
  } catch (err) {
    console.error(err);
    res.redirect('/events');
  }
};

// ─── GET /events/create ───────────────────────────────────────────────────────
exports.getCreateEvent = (req, res) => {
  res.render('events/create', { title: 'Create Event', event: null, user: req.user });
};

// ─── POST /events ─────────────────────────────────────────────────────────────
exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, type, startDate, endDate, venue,
      isVirtual, meetingLink, maxParticipants, registrationDeadline,
      tags, pointsReward, isPublic
    } = req.body;

    const qrToken = uuidv4();

    const event = await Event.create({
      title, description, type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      venue, isVirtual: isVirtual === 'on',
      meetingLink, maxParticipants: parseInt(maxParticipants) || 100,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      pointsReward: parseInt(pointsReward) || 10,
      isPublic: isPublic === 'on',
      qrCode: qrToken,
      createdBy: req.user._id,
      status: 'published'
    });

    // Generate QR code image
    const qrDataUrl = await QRCode.toDataURL(
      `${process.env.APP_URL}/attendance/scan/${qrToken}`
    );
    event.qrCodeImage = qrDataUrl;
    await event.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'EVENT_CREATED',
      entity: 'Event',
      entityId: event._id,
      details: { title }
    });

    // Send push to all internal users about new event
    try {
      const push = require('../utils/push');
      if (push.isEnabled() && event.status === 'published') {
        await push.notifyNewEvent(event);
      }
    } catch (pushErr) {
      console.warn('[PUSH] New event push failed:', pushErr.message);
    }

    res.redirect(`/events/${event._id}`);
  } catch (err) {
    console.error(err);
    res.render('events/create', {
      title: 'Create Event',
      error: err.message,
      event: req.body,
      user: req.user
    });
  }
};

// ─── POST /events/:id/register ────────────────────────────────────────────────
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Check if already registered
    const alreadyRegistered = event.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );
    if (alreadyRegistered) {
      return res.redirect(`/events/${event._id}?msg=already_registered`);
    }

    // Check capacity
    if (event.participants.length >= event.maxParticipants) {
      return res.redirect(`/events/${event._id}?msg=full`);
    }

    // External check
    if (!event.isPublic && req.user.role === 'external') {
      return res.redirect(`/events/${event._id}?msg=restricted`);
    }

    event.participants.push({ user: req.user._id });
    await event.save();

    // Add event to user
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { registeredEvents: event._id }
    });

    // Notification
    const { notify } = require('../utils/notify');
    await notify({
      recipient: req.user._id,
      type: 'event_reminder',
      title: `Registered for ${event.title}`,
      message: `You have successfully registered for ${event.title} on ${new Date(event.startDate).toLocaleDateString()}`,
      link: `/events/${event._id}`
    });

    res.redirect(`/events/${event._id}?msg=registered`);
  } catch (err) {
    console.error(err);
    res.redirect(`/events/${req.params.id}?msg=error`);
  }
};

// ─── GET /events/:id/edit ─────────────────────────────────────────────────────
exports.getEditEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).render('404', { title: '404' });
    res.render('events/create', { title: 'Edit Event', event, user: req.user });
  } catch (err) {
    res.redirect('/events');
  }
};

// ─── PUT /events/:id ──────────────────────────────────────────────────────────
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, type, startDate, endDate, venue, 
            isVirtual, meetingLink, maxParticipants, status, isPublic } = req.body;
    
    await Event.findByIdAndUpdate(req.params.id, {
      title, description, type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      venue, isVirtual: isVirtual === 'on',
      meetingLink,
      maxParticipants: parseInt(maxParticipants),
      status, isPublic: isPublic === 'on'
    });

    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/events/${req.params.id}/edit`);
  }
};

// ─── DELETE /events/:id ───────────────────────────────────────────────────────
exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect('/events');
  } catch (err) {
    res.redirect('/events');
  }
};

// ─── GET /events/:id/participants ─────────────────────────────────────────────
exports.getParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants.user', 'name email avatar rollNumber branch year');
    
    res.render('events/participants', {
      title: `Participants - ${event.title}`,
      event, user: req.user
    });
  } catch (err) {
    res.redirect('/events');
  }
};
