// routes/index.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { Hackathon } = require('../models/Hackathon');
const { Sponsor } = require('../models/index');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { Project } = require('../models/extras');
    const [upcomingEvents, hackathons, sponsors, featuredProjects] = await Promise.all([
      Event.find({ status: 'published', startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(6),
      Hackathon.find({ status: { $in: ['upcoming', 'registration_open'] } }).limit(3),
      Sponsor.find({ isActive: true, tier: { $in: ['title', 'platinum', 'gold'] } }).limit(6),
      Project.find({ status: 'featured' }).populate('authors', 'name avatar').limit(3),
    ]);
    res.render('index', { title: 'Technophiles - College Tech Club', upcomingEvents, hackathons, sponsors, featuredProjects, user: req.user });
  } catch (err) {
    res.render('index', { title: 'Technophiles', upcomingEvents: [], hackathons: [], sponsors: [], featuredProjects: [], user: null });
  }
});

module.exports = router;
