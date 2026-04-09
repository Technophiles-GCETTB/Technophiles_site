const User = require('../models/User');
const { PointsTransaction, Notification } = require('../models/index');

/**
 * Award or deduct points from a user, with transaction log and optional notification
 */
const awardPoints = async ({
  userId,
  points,
  type,
  description,
  reference = null,
  referenceModel = null,
  notify = true,
}) => {
  try {
    // Update user points
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { points } },
      { new: true }
    );
    if (!user) throw new Error('User not found');

    // Create transaction record
    await PointsTransaction.create({
      user: userId,
      points,
      type,
      description,
      reference,
      referenceModel,
      balance: user.points,
    });

    // Send in-app notification
    if (notify) {
      await Notification.create({
        recipient: userId,
        type: 'badge_earned',
        title: points > 0 ? `🎉 +${points} Points Earned!` : `⚠️ ${Math.abs(points)} Points Deducted`,
        message: description || `${Math.abs(points)} points ${points > 0 ? 'added to' : 'deducted from'} your account.`,
      });
    }

    // Check and award badges
    await checkAndAwardBadges(user);

    return { success: true, newBalance: user.points };
  } catch (err) {
    console.error('[POINTS ERROR]', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Check user's total points and award appropriate badges
 */
const checkAndAwardBadges = async (user) => {
  const badgeThresholds = [
    { points: 50,   badge: '🥉', name: 'Bronze' },
    { points: 200,  badge: '🥈', name: 'Silver' },
    { points: 500,  badge: '🥇', name: 'Gold' },
    { points: 1000, badge: '💎', name: 'Platinum' },
    { points: 2000, badge: '👑', name: 'Diamond' },
  ];

  const newBadges = [];
  for (const threshold of badgeThresholds) {
    if (user.points >= threshold.points && !user.badges.includes(threshold.badge)) {
      newBadges.push(threshold.badge);

      await Notification.create({
        recipient: user._id,
        type: 'badge_earned',
        title: `${threshold.badge} ${threshold.name} Badge Unlocked!`,
        message: `Congratulations! You've earned the ${threshold.name} badge for reaching ${threshold.points} points!`,
        link: '/leaderboard',
      });
    }
  }

  if (newBadges.length > 0) {
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { badges: { $each: newBadges } },
    });
  }
};

/**
 * Get a user's points history
 */
const getPointsHistory = async (userId, limit = 20) => {
  return PointsTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Recalculate user rank and update
 */
const updateUserRank = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;
  const rank = await User.countDocuments({ points: { $gt: user.points }, isActive: true }) + 1;
  await User.findByIdAndUpdate(userId, { rank });
  return rank;
};

module.exports = { awardPoints, checkAndAwardBadges, getPointsHistory, updateUserRank };
