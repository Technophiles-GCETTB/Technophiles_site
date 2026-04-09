const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/sponsorController');
const { authenticate } = require('../middleware/auth');

// Re-use sponsor controller for leaderboard
const User = require('../models/User');

router.get('/', authenticate, async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const matchFilter = {};
    if (filter === 'internal') matchFilter.role = 'internal';

    const leaders = await User.find({ ...matchFilter, isActive: true })
      .sort({ points: -1 }).limit(100)
      .select('name avatar email role points badges college branch year');

    const rankedLeaders = leaders.map((u, i) => ({ ...u.toObject(), rank: i + 1 }));

    let myRank = null;
    if (req.user) {
      myRank = await User.countDocuments({
        points: { $gt: req.user.points },
        isActive: true,
        ...(filter === 'internal' ? { role: 'internal' } : {})
      }) + 1;
    }

    const badges = [
      { name: 'Bronze', icon: '🥉', minPoints: 50 },
      { name: 'Silver', icon: '🥈', minPoints: 200 },
      { name: 'Gold', icon: '🥇', minPoints: 500 },
      { name: 'Platinum', icon: '💎', minPoints: 1000 },
      { name: 'Diamond', icon: '👑', minPoints: 2000 },
    ];

    res.render('leaderboard/index', {
      title: 'Leaderboard - Technophiles',
      leaders: rankedLeaders, myRank, filter, badges, user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});

module.exports = router;
