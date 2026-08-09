const { Course, Module, Progress, Roadmap } = require('../models/Course');
const User = require('../models/User');
const { PointsTransaction, Notification } = require('../models/index');

// ─── List Courses ─────────────────────────────────────────────────────────────
exports.listCourses = async (req, res) => {
  try {
    const filter = {};
    if (!req.user || req.user.role === 'external') { filter.status = 'published'; filter.accessLevel = 'all'; }
    else if (!['superadmin','admin','event_admin'].includes(req.user?.role)) filter.status = 'published';
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

    const courses = await Course.find(filter).populate('createdBy', 'name').sort({ createdAt: -1 });
    let enrolledIds = [];
    if (req.user) enrolledIds = (req.user.enrolledCourses || []).map(id => id.toString());
    res.render('courses/list', { title: 'Courses - Technophiles', courses, enrolledIds, filters: req.query, user: req.user });
  } catch (err) { console.error(err); res.redirect('/dashboard'); }
};

// ─── Get Course ───────────────────────────────────────────────────────────────
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('createdBy', 'name avatar');
    if (!course) return res.status(404).render('404', { title: '404' });
    const modules = await Module.find({ course: course._id }).sort({ order: 1 });
    let progress = null, isEnrolled = false;
    if (req.user) {
      isEnrolled = req.user.enrolledCourses?.some(id => id.toString() === course._id.toString());
      if (isEnrolled) progress = await Progress.findOne({ user: req.user._id, course: course._id });
    }
    res.render('courses/detail', { title: `${course.title} - Technophiles`, course, modules, progress, isEnrolled, user: req.user });
  } catch (err) { console.error(err); res.redirect('/courses'); }
};

// ─── Get Edit Course ──────────────────────────────────────────────────────────
exports.getEditCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('linkedEvents', 'title startDate')
      .populate('linkedLiveClasses', 'title scheduledAt');
    if (!course) return res.redirect('/courses');
    const modules = await Module.find({ course: course._id }).sort({ order: 1 });
    const Event = require('../models/Event');
    const { LiveClass } = require('../models/extras');
    const events = await Event.find({ status: 'published' }, 'title startDate type');
    const liveClasses = await LiveClass.find({}, 'title scheduledAt');
    res.render('courses/edit', { title: `Edit: ${course.title}`, course, modules, events, liveClasses, user: req.user, query: req.query });
  } catch (err) { res.redirect('/courses'); }
};

// ─── Create Course ────────────────────────────────────────────────────────────
exports.getCreateCourse = (req, res) => {
  res.render('courses/create', { title: 'Create Course', course: null, user: req.user });
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, level, tags, prerequisites, learningOutcomes, estimatedDuration, pointsReward, accessLevel, status } = req.body;
    const course = await Course.create({
      title, description, category, level,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      prerequisites: prerequisites ? prerequisites.split('\n').map(p => p.trim()).filter(Boolean) : [],
      learningOutcomes: learningOutcomes ? learningOutcomes.split('\n').map(l => l.trim()).filter(Boolean) : [],
      estimatedDuration: parseFloat(estimatedDuration) || 0,
      pointsReward: parseInt(pointsReward) || 50,
      accessLevel: accessLevel || 'internal_only',
      status: status || 'published',
      createdBy: req.user._id
    });
    res.redirect(`/courses/${course._id}/edit`);
  } catch (err) {
    console.error(err);
    res.render('courses/create', { title: 'Create Course', error: err.message, course: req.body, user: req.user });
  }
};

// ─── Update Course ────────────────────────────────────────────────────────────
exports.updateCourse = async (req, res) => {
  try {
    const { title, description, category, level, tags, prerequisites, learningOutcomes, estimatedDuration, pointsReward, accessLevel, status } = req.body;
    await Course.findByIdAndUpdate(req.params.id, {
      title, description, category, level,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      prerequisites: prerequisites ? prerequisites.split('\n').map(p => p.trim()).filter(Boolean) : [],
      learningOutcomes: learningOutcomes ? learningOutcomes.split('\n').map(l => l.trim()).filter(Boolean) : [],
      estimatedDuration: parseFloat(estimatedDuration) || 0,
      pointsReward: parseInt(pointsReward) || 50,
      accessLevel, status
    });
    res.redirect(`/courses/${req.params.id}/edit?msg=updated`);
  } catch (err) { res.redirect(`/courses/${req.params.id}/edit`); }
};

// ─── Delete Course ────────────────────────────────────────────────────────────
exports.deleteCourse = async (req, res) => {
  try {
    await Module.deleteMany({ course: req.params.id });
    await Course.findByIdAndDelete(req.params.id);
    res.redirect('/courses');
  } catch (err) { res.redirect('/courses'); }
};

// ─── Add Module (GET form) ────────────────────────────────────────────────────
exports.getAddModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    res.render('courses/module-form', { title: 'Add Module', course, mod: null, user: req.user });
  } catch (err) { res.redirect(`/courses/${req.params.id}/edit`); }
};

// ─── Add Module (POST) ────────────────────────────────────────────────────────
exports.addModule = async (req, res) => {
  try {
    const { title, description, type, videoUrl, article, duration, pointsReward, isPreview } = req.body;
    const resources = [];
    const resTitle = [].concat(req.body['res_title'] || []);
    const resUrl = [].concat(req.body['res_url'] || []);
    const resType = [].concat(req.body['res_type'] || []);
    resTitle.forEach((t, i) => { if (t && resUrl[i]) resources.push({ title: t, url: resUrl[i], type: resType[i] || 'link' }); });

    const moduleCount = await Module.countDocuments({ course: req.params.id });
    await Module.create({
      title, description, type: type || 'video',
      course: req.params.id,
      order: moduleCount + 1,
      content: { videoUrl, article, duration: parseInt(duration) || 0, resources },
      pointsReward: parseInt(pointsReward) || 5,
      isPreview: isPreview === 'on'
    });
    res.redirect(`/courses/${req.params.id}/edit?msg=module_added`);
  } catch (err) { console.error(err); res.redirect(`/courses/${req.params.id}/edit`); }
};

// ─── Edit Module (GET) ────────────────────────────────────────────────────────
exports.getEditModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const mod = await Module.findById(req.params.moduleId);
    res.render('courses/module-form', { title: 'Edit Module', course, mod, user: req.user });
  } catch (err) { res.redirect(`/courses/${req.params.id}/edit`); }
};

// ─── Update Module ────────────────────────────────────────────────────────────
exports.updateModule = async (req, res) => {
  try {
    const { title, description, type, videoUrl, article, duration, pointsReward, isPreview } = req.body;
    const resources = [];
    const resTitle = [].concat(req.body['res_title'] || []);
    const resUrl = [].concat(req.body['res_url'] || []);
    const resType = [].concat(req.body['res_type'] || []);
    resTitle.forEach((t, i) => { if (t && resUrl[i]) resources.push({ title: t, url: resUrl[i], type: resType[i] || 'link' }); });

    await Module.findByIdAndUpdate(req.params.moduleId, {
      title, description, type,
      content: { videoUrl, article, duration: parseInt(duration) || 0, resources },
      pointsReward: parseInt(pointsReward) || 5,
      isPreview: isPreview === 'on'
    });
    res.redirect(`/courses/${req.params.id}/edit?msg=module_updated`);
  } catch (err) { res.redirect(`/courses/${req.params.id}/edit`); }
};

// ─── Delete Module ────────────────────────────────────────────────────────────
exports.deleteModule = async (req, res) => {
  try {
    await Module.findByIdAndDelete(req.params.moduleId);
    res.redirect(`/courses/${req.params.id}/edit?msg=module_deleted`);
  } catch (err) { res.redirect(`/courses/${req.params.id}/edit`); }
};

// ─── Link Event to Course ─────────────────────────────────────────────────────
exports.linkEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event) return res.redirect(`/courses/${req.params.id}/edit`);
    const course = await Course.findById(req.params.id);
    if (!course.linkedEvents) course.linkedEvents = [];
    if (!course.linkedEvents.map(e => e.toString()).includes(eventId)) {
      course.linkedEvents.push(eventId);
      await course.save();
    }
    res.redirect(`/courses/${req.params.id}/edit?msg=event_linked`);
  } catch (err) { res.redirect(`/courses/${req.params.id}/edit`); }
};

// ─── Link Live Class to Course ────────────────────────────────────────────────
exports.linkLiveClass = async (req, res) => {
  try {
    const { liveClassId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course.linkedLiveClasses) course.linkedLiveClasses = [];
    if (!course.linkedLiveClasses.map(l => l.toString()).includes(liveClassId)) {
      course.linkedLiveClasses.push(liveClassId);
      await course.save();
    }
    res.redirect(`/courses/${req.params.id}/edit?msg=liveclass_linked`);
  } catch (err) { res.redirect(`/courses/${req.params.id}/edit`); }
};

// ─── Enroll ───────────────────────────────────────────────────────────────────
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.redirect('/courses');
    const alreadyEnrolled = req.user.enrolledCourses?.some(id => id.toString() === course._id.toString());
    if (!alreadyEnrolled) {
      const modules = await Module.find({ course: course._id }).sort({ order: 1 });
      await Progress.create({ user: req.user._id, course: course._id, currentModule: modules[0]?._id });
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: course._id } });
      await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });
    }
    res.redirect(`/courses/${course._id}/learn`);
  } catch (err) { console.error(err); res.redirect(`/courses/${req.params.id}`); }
};

// ─── Learn ────────────────────────────────────────────────────────────────────
exports.learnCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const modules = await Module.find({ course: course._id }).sort({ order: 1 });
    const progress = await Progress.findOne({ user: req.user._id, course: course._id });
    if (!progress) return res.redirect(`/courses/${course._id}`);
    const currentModuleId = req.query.module || progress.currentModule;
    const currentModule = modules.find(m => m._id.toString() === currentModuleId?.toString()) || modules[0];
    res.render('courses/learn', { title: `${course.title} - Learning`, course, modules, currentModule, progress, user: req.user });
  } catch (err) { console.error(err); res.redirect('/courses'); }
};

// ─── Complete Module ──────────────────────────────────────────────────────────
exports.completeModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const course = await Course.findById(req.params.id);
    const modules = await Module.find({ course: course._id }).sort({ order: 1 });
    const progress = await Progress.findOne({ user: req.user._id, course: course._id });
    if (!progress) return res.redirect(`/courses/${course._id}`);

    if (!progress.completedModules.map(m => m.toString()).includes(moduleId)) {
      progress.completedModules.push(moduleId);
      const mod = await Module.findById(moduleId);
      const pts = mod?.pointsReward || 5;
      progress.pointsEarned += pts;
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: pts } });
      await PointsTransaction.create({ user: req.user._id, points: pts, type: 'module_completion', description: `Completed: ${mod?.title}`, reference: course._id, referenceModel: 'Course' });
    }

    progress.progressPercent = Math.round((progress.completedModules.length / modules.length) * 100);
    const currentIndex = modules.findIndex(m => m._id.toString() === moduleId);
    const nextModule = modules[currentIndex + 1];
    progress.currentModule = nextModule?._id;
    progress.lastAccessedAt = new Date();

    if (progress.completedModules.length >= modules.length) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: course.pointsReward }, $addToSet: { completedCourses: course._id } });
      await PointsTransaction.create({ user: req.user._id, points: course.pointsReward, type: 'course_completion', description: `Completed: ${course.title}`, reference: course._id, referenceModel: 'Course' });
      const { notify } = require('../utils/notify');
      await notify({
        recipient: req.user._id,
        type: 'course_update',
        title: '🎉 Course Completed!',
        message: `You have successfully completed "${course.title}"! You earned ${course.pointsReward} points.`,
        link: `/courses/${course._id}`
      });
    }
    await progress.save();
    const nextId = nextModule?._id || modules[0]._id;
    res.redirect(`/courses/${course._id}/learn?module=${nextId}`);
  } catch (err) { console.error(err); res.redirect(`/courses/${req.params.id}/learn`); }
};

// ─── Roadmaps ─────────────────────────────────────────────────────────────────
exports.listRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find().populate('steps.course', 'title thumbnail');
    res.render('courses/roadmaps', { title: 'Learning Roadmaps', roadmaps, user: req.user });
  } catch (err) { res.redirect('/courses'); }
};
