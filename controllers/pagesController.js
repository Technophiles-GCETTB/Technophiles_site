const { Page, ContactMessage } = require('../models/extras');
const { Roadmap } = require('../models/Course');
const Event = require('../models/Event');
const { Hackathon } = require('../models/Hackathon');
const { LiveClass } = require('../models/extras');

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
exports.getAbout = async (req, res) => {
  try {
    let page = await Page.findOne({ slug: 'about' });
    if (!page) {
      page = {
        title: 'About Technophiles',
        mission: 'To foster a culture of innovation, learning, and collaboration among students.',
        vision: 'To be the premier tech community that shapes the next generation of engineers.',
        founded: '2018',
        collegeAffiliation: 'GCETTB',
        stats: [
          { label: 'Members', value: '500+', icon: '👥' },
          { label: 'Events', value: '50+', icon: '📅' },
          { label: 'Hackathons', value: '20+', icon: '⚡' },
          { label: 'Awards', value: '15+', icon: '🏆' },
        ],
        socialLinks: {},
      };
    }
    const { Member } = require('../models/extras');
    const coreMembers = await Member.find({ category: 'core', isActive: true }).sort({ order: 1 }).limit(8);
    res.render('about/index', { title: 'About Us - Technophiles', page, coreMembers, user: req.user });
  } catch (err) {
    console.error(err);
    res.render('about/index', { title: 'About Us', page: {}, coreMembers: [], user: req.user });
  }
};

exports.getEditAbout = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: 'about' }) || {};
    res.render('about/edit', { title: 'Edit About Page', page, user: req.user });
  } catch (err) {
    res.redirect('/about');
  }
};

exports.updateAbout = async (req, res) => {
  try {
    const { title, mission, vision, founded, collegeAffiliation, content,
      contactEmail, github, linkedin, instagram, twitter, youtube, discord, website } = req.body;

    const stats = [];
    const statLabels = [].concat(req.body['stat_label'] || []);
    const statValues = [].concat(req.body['stat_value'] || []);
    const statIcons = [].concat(req.body['stat_icon'] || []);
    statLabels.forEach((label, i) => {
      if (label) stats.push({ label, value: statValues[i] || '', icon: statIcons[i] || '' });
    });

    await Page.findOneAndUpdate(
      { slug: 'about' },
      { slug: 'about', title, mission, vision, founded, collegeAffiliation, content, stats,
        socialLinks: { github, linkedin, instagram, twitter, youtube, discord, website },
        updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    res.redirect('/about?msg=updated');
  } catch (err) {
    res.redirect('/about/edit');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
exports.getContact = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: 'contact' }) || {};
    res.render('contact/index', { title: 'Contact Us - Technophiles', page, sent: req.query.sent, user: req.user });
  } catch (err) {
    res.render('contact/index', { title: 'Contact Us', page: {}, sent: null, user: req.user });
  }
};

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    await ContactMessage.create({ name, email, subject, message, ip: req.ip });
    res.redirect('/contact?sent=1');
  } catch (err) {
    res.redirect('/contact?error=1');
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.render('contact/messages', { title: 'Contact Messages', messages, user: req.user });
  } catch (err) {
    res.redirect('/admin');
  }
};

exports.getEditContact = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: 'contact' }) || {};
    res.render('contact/edit', { title: 'Edit Contact Page', page, user: req.user });
  } catch (err) {
    res.redirect('/contact');
  }
};

exports.updateContact = async (req, res) => {
  try {
    const { title, contactEmail, contactPhone, address, mapEmbedUrl, content } = req.body;
    const faqs = [];
    const faqQs = [].concat(req.body['faq_q'] || []);
    const faqAs = [].concat(req.body['faq_a'] || []);
    faqQs.forEach((q, i) => { if (q) faqs.push({ question: q, answer: faqAs[i] || '' }); });
    await Page.findOneAndUpdate(
      { slug: 'contact' },
      { slug: 'contact', title, contactEmail, contactPhone, address, mapEmbedUrl, content, faqs, updatedBy: req.user._id },
      { upsert: true }
    );
    res.redirect('/contact?msg=updated');
  } catch (err) {
    res.redirect('/contact/edit');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP (full CRUD)
// ═══════════════════════════════════════════════════════════════════════════════
exports.listRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find().populate('steps.course', 'title thumbnail category');
    res.render('roadmap/list', { title: 'Learning Roadmaps', roadmaps, user: req.user });
  } catch (err) {
    res.redirect('/');
  }
};

exports.getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id).populate('steps.course', 'title thumbnail category level');
    if (!roadmap) return res.status(404).render('404', { title: '404' });
    let userProgress = {};
    if (req.user) {
      const { Progress } = require('../models/Course');
      const progList = await Progress.find({ user: req.user._id });
      progList.forEach(p => { userProgress[p.course.toString()] = p; });
    }
    res.render('roadmap/detail', { title: roadmap.title, roadmap, userProgress, user: req.user });
  } catch (err) {
    res.redirect('/roadmaps');
  }
};

exports.getCreateRoadmap = async (req, res) => {
  const { Course } = require('../models/Course');
  const courses = await Course.find({ status: 'published' }, 'title category');
  res.render('roadmap/form', { title: 'Create Roadmap', roadmap: null, courses, user: req.user });
};

exports.createRoadmap = async (req, res) => {
  try {
    const { title, description, category, icon, color } = req.body;
    const steps = [];
    const stepTitles = [].concat(req.body['step_title'] || []);
    const stepDescs = [].concat(req.body['step_desc'] || []);
    const stepCourses = [].concat(req.body['step_course'] || []);
    const stepOptional = [].concat(req.body['step_optional'] || []);
    stepTitles.forEach((t, i) => {
      if (t) steps.push({ order: i + 1, title: t, description: stepDescs[i] || '', course: stepCourses[i] || undefined, isOptional: stepOptional[i] === 'on' });
    });
    await Roadmap.create({ title, description, category, icon, color: color || '#39FF14', steps, createdBy: req.user._id });
    res.redirect('/roadmaps');
  } catch (err) {
    const { Course } = require('../models/Course');
    const courses = await Course.find({ status: 'published' }, 'title category');
    res.render('roadmap/form', { title: 'Create Roadmap', roadmap: req.body, courses, error: err.message, user: req.user });
  }
};

exports.getEditRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id).populate('steps.course', 'title');
    const { Course } = require('../models/Course');
    const courses = await Course.find({ status: 'published' }, 'title category');
    res.render('roadmap/form', { title: 'Edit Roadmap', roadmap, courses, user: req.user });
  } catch (err) {
    res.redirect('/roadmaps');
  }
};

exports.updateRoadmap = async (req, res) => {
  try {
    const { title, description, category, icon, color } = req.body;
    const steps = [];
    const stepTitles = [].concat(req.body['step_title'] || []);
    const stepDescs = [].concat(req.body['step_desc'] || []);
    const stepCourses = [].concat(req.body['step_course'] || []);
    stepTitles.forEach((t, i) => {
      if (t) steps.push({ order: i + 1, title: t, description: stepDescs[i] || '', course: stepCourses[i] || undefined });
    });
    await Roadmap.findByIdAndUpdate(req.params.id, { title, description, category, icon, color, steps });
    res.redirect(`/roadmaps/${req.params.id}`);
  } catch (err) {
    res.redirect(`/roadmaps/${req.params.id}/edit`);
  }
};

exports.deleteRoadmap = async (req, res) => {
  try {
    await Roadmap.findByIdAndDelete(req.params.id);
    res.redirect('/roadmaps');
  } catch (err) {
    res.redirect('/roadmaps');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR - aggregates all events, hackathons, live classes
// ═══════════════════════════════════════════════════════════════════════════════
exports.getCalendar = async (req, res) => {
  try {
    const [events, hackathons, liveClasses] = await Promise.all([
      Event.find({ status: { $in: ['published', 'ongoing'] } }, 'title startDate endDate type status'),
      Hackathon.find({ status: { $ne: 'cancelled' } }, 'title hackathonStart hackathonEnd registrationEnd status'),
      LiveClass.find({ status: { $in: ['scheduled', 'live'] } }, 'title scheduledAt endAt status platform'),
    ]);

    // Build unified calendar items array for FullCalendar
    const calItems = [
      ...events.map(e => ({
        id: e._id, title: e.title,
        start: e.startDate, end: e.endDate,
        color: '#39FF14', textColor: '#000',
        url: `/events/${e._id}`, type: 'event',
        category: e.type,
      })),
      ...hackathons.map(h => ({
        id: h._id, title: `⚡ ${h.title}`,
        start: h.hackathonStart, end: h.hackathonEnd,
        color: '#7c3aed', textColor: '#fff',
        url: `/hackathons/${h._id}`, type: 'hackathon',
        category: 'hackathon',
      })),
      ...hackathons.filter(h => h.registrationEnd).map(h => ({
        id: h._id + '_reg', title: `📋 ${h.title} - Reg Deadline`,
        start: h.registrationEnd, allDay: true,
        color: '#f59e0b', textColor: '#000',
        url: `/hackathons/${h._id}`, type: 'deadline',
        category: 'deadline',
      })),
      ...liveClasses.map(lc => ({
        id: lc._id, title: `🔴 ${lc.title}`,
        start: lc.scheduledAt, end: lc.endAt,
        color: '#ef4444', textColor: '#fff',
        url: `/live-classes/${lc._id}`, type: 'live',
        category: 'live_class',
      })),
    ];

    res.render('calendar/index', {
      title: 'Event Calendar - Technophiles',
      calItemsJSON: JSON.stringify(calItems),
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.render('calendar/index', { title: 'Calendar', calItemsJSON: '[]', user: req.user });
  }
};
