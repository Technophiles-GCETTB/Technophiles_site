const User = require('../models/User');
const { Sponsor, PointsTransaction } = require('../models/index');

// ─── Leaderboard ──────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const matchFilter = {};
    if (filter === 'internal') matchFilter.role = 'internal';

    const leaders = await User.find({ ...matchFilter, isActive: true })
      .sort({ points: -1 })
      .limit(100)
      .select('name avatar email role points badges college branch year');

    // Assign ranks
    const rankedLeaders = leaders.map((u, i) => ({ ...u.toObject(), rank: i + 1 }));

    // My rank
    let myRank = null;
    if (req.user) {
      myRank = await User.countDocuments({ 
        points: { $gt: req.user.points }, 
        isActive: true,
        ...(filter === 'internal' ? { role: 'internal' } : {})
      }) + 1;
    }

    // Badge thresholds
    const badges = [
      { name: 'Bronze', icon: '🥉', minPoints: 50 },
      { name: 'Silver', icon: '🥈', minPoints: 200 },
      { name: 'Gold', icon: '🥇', minPoints: 500 },
      { name: 'Platinum', icon: '💎', minPoints: 1000 },
      { name: 'Diamond', icon: '👑', minPoints: 2000 },
    ];

    res.render('leaderboard/index', {
      title: 'Leaderboard - Technophiles',
      leaders: rankedLeaders,
      myRank, filter, badges,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

// ─── Sponsors List ────────────────────────────────────────────────────────────
exports.listSponsors = async (req, res) => {
  try {
    const sponsors = await Sponsor.find({ isActive: true }).sort({ tier: 1, name: 1 });

    const grouped = {
      title: sponsors.filter(s => s.tier === 'title'),
      platinum: sponsors.filter(s => s.tier === 'platinum'),
      gold: sponsors.filter(s => s.tier === 'gold'),
      silver: sponsors.filter(s => s.tier === 'silver'),
      bronze: sponsors.filter(s => s.tier === 'bronze'),
      community: sponsors.filter(s => s.tier === 'community'),
    };

    res.render('sponsor/list', {
      title: 'Our Sponsors - Technophiles',
      sponsors, grouped, user: req.user
    });
  } catch (err) {
    res.redirect('/');
  }
};

// ─── Create Sponsor ───────────────────────────────────────────────────────────
exports.createSponsor = async (req, res) => {
  try {
    const { name, website, description, tier, contactName, contactEmail, contactPhone, amount } = req.body;
    await Sponsor.create({ name, website, description, tier, contactName, contactEmail, contactPhone, amount });
    res.redirect('/sponsors?msg=created');
  } catch (err) {
    res.redirect('/sponsors');
  }
};

exports.getCreateSponsor = (req, res) => {
  res.render('sponsor/create', { title: 'Add Sponsor', user: req.user });
};
