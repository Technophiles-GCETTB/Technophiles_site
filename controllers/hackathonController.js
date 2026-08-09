const { Hackathon, Team, Submission } = require('../models/Hackathon');
const User = require('../models/User');
const { Notification, ActivityLog, PointsTransaction } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

// ─── List Hackathons ──────────────────────────────────────────────────────────
exports.listHackathons = async (req, res) => {
  try {
    const filter = {};
    if (!req.user || req.user.role === 'external') filter.isPublic = true;
    if (req.query.status) filter.status = req.query.status;

    const hackathons = await Hackathon.find(filter)
      .populate('createdBy', 'name')
      .sort({ hackathonStart: 1 });

    res.render('hackathons/list', {
      title: 'Hackathons - Technophiles',
      hackathons, user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

// ─── Get Hackathon ────────────────────────────────────────────────────────────
exports.getHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('judges', 'name avatar')
      .populate('sponsors', 'name logo tier');

    if (!hackathon) return res.status(404).render('404', { title: '404' });

    // User's team
    let myTeam = null;
    if (req.user) {
      myTeam = await Team.findOne({
        hackathon: hackathon._id,
        $or: [{ leader: req.user._id }, { 'members.user': req.user._id }]
      }).populate('leader', 'name').populate('members.user', 'name avatar');
    }

    const teamCount = await Team.countDocuments({ hackathon: hackathon._id });

    res.render('hackathons/detail', {
      title: `${hackathon.title} - Technophiles`,
      hackathon, myTeam, teamCount, user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/hackathons');
  }
};

// ─── Create Hackathon ─────────────────────────────────────────────────────────
exports.getCreateHackathon = (req, res) => {
  res.render('hackathons/create', { title: 'Create Hackathon', hackathon: null, user: req.user });
};

exports.createHackathon = async (req, res) => {
  try {
    const {
      title, tagline, description, hackathonStart, hackathonEnd,
      registrationStart, registrationEnd, submissionDeadline,
      venue, isVirtual, meetingLink, maxTeamSize, minTeamSize,
      maxTeams, pointsReward, isPublic
    } = req.body;

    const hackathon = await Hackathon.create({
      title, tagline, description,
      hackathonStart: new Date(hackathonStart),
      hackathonEnd: new Date(hackathonEnd),
      registrationStart: new Date(registrationStart),
      registrationEnd: new Date(registrationEnd),
      submissionDeadline: new Date(submissionDeadline),
      venue, isVirtual: isVirtual === 'on', meetingLink,
      maxTeamSize: parseInt(maxTeamSize) || 4,
      minTeamSize: parseInt(minTeamSize) || 1,
      maxTeams: parseInt(maxTeams) || 50,
      pointsReward: parseInt(pointsReward) || 100,
      isPublic: isPublic !== 'off',
      status: 'upcoming',
      createdBy: req.user._id
    });

    res.redirect(`/hackathons/${hackathon._id}`);
  } catch (err) {
    console.error(err);
    res.render('hackathons/create', {
      title: 'Create Hackathon',
      error: err.message, hackathon: req.body, user: req.user
    });
  }
};

// ─── Create Team ──────────────────────────────────────────────────────────────
exports.createTeam = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.redirect('/hackathons');

    // Check if user already in a team
    const existingTeam = await Team.findOne({
      hackathon: hackathon._id,
      $or: [{ leader: req.user._id }, { 'members.user': req.user._id }]
    });
    if (existingTeam) {
      return res.redirect(`/hackathons/${hackathon._id}?msg=already_in_team`);
    }

    const team = await Team.create({
      name: req.body.teamName,
      hackathon: hackathon._id,
      leader: req.user._id,
      inviteCode: uuidv4().slice(0, 8).toUpperCase(),
      problemStatement: req.body.problemStatement
    });

    // Add to user's teams
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { teams: team._id } });

    res.redirect(`/hackathons/${hackathon._id}/teams/${team._id}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/hackathons/${req.params.id}?msg=team_error`);
  }
};

// ─── Join Team by Invite Code ─────────────────────────────────────────────────
exports.joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const hackathon = await Hackathon.findById(req.params.id);

    const team = await Team.findOne({ 
      hackathon: hackathon._id, 
      inviteCode: inviteCode.toUpperCase() 
    });

    if (!team) {
      return res.redirect(`/hackathons/${hackathon._id}?msg=invalid_code`);
    }

    // Check team size
    if (team.members.length >= hackathon.maxTeamSize - 1) {
      return res.redirect(`/hackathons/${hackathon._id}?msg=team_full`);
    }

    // Check not already in team
    const alreadyMember = team.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember || team.leader.toString() === req.user._id.toString()) {
      return res.redirect(`/hackathons/${hackathon._id}?msg=already_member`);
    }

    team.members.push({ user: req.user._id });
    await team.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { teams: team._id } });

    res.redirect(`/hackathons/${hackathon._id}/teams/${team._id}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/hackathons/${req.params.id}`);
  }
};

// ─── Get Team ─────────────────────────────────────────────────────────────────
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('leader', 'name avatar email github')
      .populate('members.user', 'name avatar email github')
      .populate('hackathon', 'title maxTeamSize submissionDeadline');

    const submission = await Submission.findOne({ team: team._id });

    res.render('hackathons/team', {
      title: `Team ${team.name}`,
      team, submission, user: req.user
    });
  } catch (err) {
    res.redirect(`/hackathons/${req.params.id}`);
  }
};

// ─── Submit Project ───────────────────────────────────────────────────────────
exports.submitProject = async (req, res) => {
  try {
    const { projectTitle, description, githubLink, demoLink, techStack } = req.body;
    const team = await Team.findById(req.params.teamId);

    // Only leader can submit
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.redirect(`/hackathons/${req.params.id}/teams/${req.params.teamId}?msg=not_leader`);
    }

    const hackathon = await Hackathon.findById(req.params.id);
    const isLate = hackathon.submissionDeadline && new Date() > hackathon.submissionDeadline;

    // Upsert submission
    await Submission.findOneAndUpdate(
      { team: team._id },
      {
        hackathon: hackathon._id,
        team: team._id,
        projectTitle, description, githubLink, demoLink,
        techStack: techStack ? techStack.split(',').map(t => t.trim()) : [],
        submittedAt: new Date(),
        isLate
      },
      { upsert: true, new: true }
    );

    team.status = 'submitted';
    await team.save();

    // Award points for submission
    const allMembers = [team.leader, ...team.members.map(m => m.user)];
    for (const userId of allMembers) {
      await User.findByIdAndUpdate(userId, { $inc: { points: 50 } });
      await PointsTransaction.create({
        user: userId,
        points: 50,
        type: 'hackathon_participation',
        description: `Project submission: ${projectTitle}`,
        reference: hackathon._id,
        referenceModel: 'Hackathon'
      });
    }

    res.redirect(`/hackathons/${req.params.id}/teams/${team._id}?msg=submitted`);
  } catch (err) {
    console.error(err);
    res.redirect(`/hackathons/${req.params.id}/teams/${req.params.teamId}`);
  }
};

// ─── Judge: Score Submission ──────────────────────────────────────────────────
exports.scoreSubmission = async (req, res) => {
  try {
    const { innovation, technicality, impact, presentation, feedback } = req.body;
    const total = (parseInt(innovation) + parseInt(technicality) + parseInt(impact) + parseInt(presentation));

    const submission = await Submission.findById(req.params.submissionId);

    // Remove previous score from this judge
    submission.scores = submission.scores.filter(s => 
      s.judge.toString() !== req.user._id.toString()
    );

    submission.scores.push({
      judge: req.user._id,
      innovation: parseInt(innovation),
      technicality: parseInt(technicality),
      impact: parseInt(impact),
      presentation: parseInt(presentation),
      total,
      feedback
    });

    submission.calculateAverageScore();
    await submission.save();

    res.redirect(`/hackathons/${req.params.id}/judge?msg=scored`);
  } catch (err) {
    console.error(err);
    res.redirect(`/hackathons/${req.params.id}/judge`);
  }
};

// ─── Hackathon Leaderboard ────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    const submissions = await Submission.find({ hackathon: hackathon._id })
      .populate({ path: 'team', populate: { path: 'leader members.user', select: 'name avatar' } })
      .sort({ averageScore: -1 });

    res.render('hackathons/leaderboard', {
      title: `${hackathon.title} - Leaderboard`,
      hackathon, submissions, user: req.user
    });
  } catch (err) {
    res.redirect('/hackathons');
  }
};

// ─── Judge Panel ──────────────────────────────────────────────────────────────
exports.getJudgePanel = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.redirect('/hackathons');

    const submissions = await Submission.find({ hackathon: hackathon._id })
      .populate({ path: 'team', populate: { path: 'leader', select: 'name avatar' } })
      .populate('scores.judge', 'name')
      .sort({ submittedAt: -1 });

    res.render('hackathons/judge', {
      title: `Judge Panel - ${hackathon.title}`,
      hackathon, submissions, user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/hackathons');
  }
};
