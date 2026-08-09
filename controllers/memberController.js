const { Member } = require('../models/extras');

// ─── List Members (Public) ────────────────────────────────────────────────────
exports.listMembers = async (req, res) => {
  try {
    const members = await Member.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    const grouped = {
      core: members.filter(m => m.category === 'core'),
      technical: members.filter(m => m.category === 'technical'),
      creative: members.filter(m => m.category === 'creative'),
      management: members.filter(m => m.category === 'management'),
      faculty: members.filter(m => m.category === 'faculty'),
      alumni: members.filter(m => m.category === 'alumni'),
    };
    res.render('members/list', { title: 'Club Members - Technophiles', members, grouped, user: req.user });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// ─── Admin: Manage Members ────────────────────────────────────────────────────
exports.adminList = async (req, res) => {
  try {
    const members = await Member.find().sort({ order: 1, createdAt: 1 });
    res.render('members/admin', { title: 'Manage Members', members, user: req.user });
  } catch (err) {
    res.redirect('/admin');
  }
};

// ─── Create Member (GET) ──────────────────────────────────────────────────────
exports.getCreate = (req, res) => {
  res.render('members/form', { title: 'Add Member', member: null, user: req.user });
};

// ─── Create Member (POST) ─────────────────────────────────────────────────────
exports.createMember = async (req, res) => {
  try {
    const { name, post, department, year, bio, email, github, linkedin, instagram, category, order, joinedYear, batch, image } = req.body;
    const achievements = req.body.achievements ? req.body.achievements.split('\n').map(a => a.trim()).filter(Boolean) : [];
    await Member.create({
      name, post, department, year, bio, email, github, linkedin, instagram,
      category: category || 'core',
      order: parseInt(order) || 99,
      joinedYear, batch,
      image: image || '/images/default-avatar.png',
      achievements,
      createdBy: req.user._id,
    });
    res.redirect('/members/admin?msg=created');
  } catch (err) {
    console.error(err);
    res.render('members/form', { title: 'Add Member', member: req.body, error: err.message, user: req.user });
  }
};

// ─── Edit Member (GET) ────────────────────────────────────────────────────────
exports.getEdit = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.redirect('/members/admin');
    res.render('members/form', { title: 'Edit Member', member, user: req.user });
  } catch (err) {
    res.redirect('/members/admin');
  }
};

// ─── Update Member (PUT) ──────────────────────────────────────────────────────
exports.updateMember = async (req, res) => {
  try {
    const { name, post, department, year, bio, email, github, linkedin, instagram, category, order, joinedYear, batch, image, isActive } = req.body;
    const achievements = req.body.achievements ? req.body.achievements.split('\n').map(a => a.trim()).filter(Boolean) : [];
    await Member.findByIdAndUpdate(req.params.id, {
      name, post, department, year, bio, email, github, linkedin, instagram,
      category, order: parseInt(order) || 99,
      joinedYear, batch,
      image: image || '/images/default-avatar.png',
      achievements,
      isActive: isActive !== 'false',
    });
    res.redirect('/members/admin?msg=updated');
  } catch (err) {
    res.redirect(`/members/${req.params.id}/edit`);
  }
};

// ─── Delete Member ────────────────────────────────────────────────────────────
exports.deleteMember = async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.redirect('/members/admin?msg=deleted');
  } catch (err) {
    res.redirect('/members/admin');
  }
};
