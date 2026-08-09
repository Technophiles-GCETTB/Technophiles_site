const { Project } = require('../models/extras');
const User = require('../models/User');

// ─── List Projects ────────────────────────────────────────────────────────────
exports.listProjects = async (req, res) => {
  try {
    const { category, search, sort = 'newest' } = req.query;
    const filter = { status: { $in: ['published', 'featured'] } };
    if (category) filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { techStack: { $regex: search, $options: 'i' } },
    ];
    const sortOpts = sort === 'popular' ? { likes: -1 } : sort === 'views' ? { views: -1 } : { createdAt: -1 };

    const featured = await Project.find({ status: 'featured' }).populate('authors', 'name avatar').limit(3);
    const projects = await Project.find(filter).populate('authors', 'name avatar').sort(sortOpts);

    res.render('projects/list', {
      title: 'Project Showcase - Technophiles',
      projects, featured, filters: { category, search, sort }, user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// ─── Get Project ──────────────────────────────────────────────────────────────
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('authors', 'name avatar github linkedin')
     .populate('hackathon', 'title')
     .populate('createdBy', 'name avatar');

    if (!project || project.status === 'draft') {
      const isOwner = req.user && project?.createdBy?._id?.toString() === req.user._id.toString();
      if (!isOwner) return res.status(404).render('404', { title: '404' });
    }

    const isLiked = req.user && project.likedBy.map(u => u.toString()).includes(req.user._id.toString());
    const related = await Project.find({
      category: project.category,
      _id: { $ne: project._id },
      status: { $in: ['published', 'featured'] }
    }).limit(3).populate('authors', 'name');

    res.render('projects/detail', { title: project.title, project, isLiked, related, user: req.user });
  } catch (err) {
    console.error(err);
    res.redirect('/projects');
  }
};

// ─── Create Project (GET) ─────────────────────────────────────────────────────
exports.getCreate = (req, res) => {
  res.render('projects/form', { title: 'Submit Project', project: null, user: req.user });
};

// ─── Create Project (POST) ────────────────────────────────────────────────────
exports.createProject = async (req, res) => {
  try {
    const { title, description, longDescription, category, thumbnail, githubLink, liveLink, demoVideo, techStack, tags, authorNames } = req.body;
    const project = await Project.create({
      title, description, longDescription, category,
      thumbnail: thumbnail || '/images/project-default.jpg',
      githubLink, liveLink, demoVideo,
      techStack: techStack ? techStack.split(',').map(t => t.trim()).filter(Boolean) : [],
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      authorNames: authorNames ? authorNames.split('\n').map(a => a.trim()).filter(Boolean) : [],
      authors: [req.user._id],
      status: 'published',
      createdBy: req.user._id,
    });
    res.redirect(`/projects/${project._id}`);
  } catch (err) {
    console.error(err);
    res.render('projects/form', { title: 'Submit Project', project: req.body, error: err.message, user: req.user });
  }
};

// ─── Edit Project (GET) ───────────────────────────────────────────────────────
exports.getEdit = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.redirect('/projects');
    const canEdit = req.user && (
      project.createdBy.toString() === req.user._id.toString() ||
      ['superadmin', 'admin'].includes(req.user.role)
    );
    if (!canEdit) return res.status(403).render('error', { title: 'Access Denied', message: 'You cannot edit this project.', user: req.user });
    res.render('projects/form', { title: 'Edit Project', project, user: req.user });
  } catch (err) {
    res.redirect('/projects');
  }
};

// ─── Update Project (PUT) ─────────────────────────────────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const canEdit = req.user && (
      project.createdBy.toString() === req.user._id.toString() ||
      ['superadmin', 'admin'].includes(req.user.role)
    );
    if (!canEdit) return res.redirect('/projects');

    const { title, description, longDescription, category, thumbnail, githubLink, liveLink, demoVideo, techStack, tags, authorNames, status, isFeatured } = req.body;
    await Project.findByIdAndUpdate(req.params.id, {
      title, description, longDescription, category,
      thumbnail: thumbnail || '/images/project-default.jpg',
      githubLink, liveLink, demoVideo,
      techStack: techStack ? techStack.split(',').map(t => t.trim()).filter(Boolean) : [],
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      authorNames: authorNames ? authorNames.split('\n').map(a => a.trim()).filter(Boolean) : [],
      status: status || 'published',
      isFeatured: isFeatured === 'on',
    });
    res.redirect(`/projects/${req.params.id}`);
  } catch (err) {
    res.redirect(`/projects/${req.params.id}/edit`);
  }
};

// ─── Delete Project ───────────────────────────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const canDelete = req.user && (
      project.createdBy.toString() === req.user._id.toString() ||
      ['superadmin', 'admin'].includes(req.user.role)
    );
    if (!canDelete) return res.redirect('/projects');
    await Project.findByIdAndDelete(req.params.id);
    res.redirect('/projects');
  } catch (err) {
    res.redirect('/projects');
  }
};

// ─── Like / Unlike Project (AJAX) ─────────────────────────────────────────────
exports.toggleLike = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const userId = req.user._id.toString();
    const likedBy = project.likedBy.map(u => u.toString());
    let liked;
    if (likedBy.includes(userId)) {
      project.likedBy = project.likedBy.filter(u => u.toString() !== userId);
      project.likes = Math.max(0, project.likes - 1);
      liked = false;
    } else {
      project.likedBy.push(req.user._id);
      project.likes += 1;
      liked = true;
    }
    await project.save();
    res.json({ success: true, likes: project.likes, liked });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
