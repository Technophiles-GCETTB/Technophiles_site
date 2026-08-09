const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { authenticate } = require('../middleware/auth');
const Event = require('../models/Event');
const { Attendance } = require('../models/index');
const { Hackathon, Submission, Team } = require('../models/Hackathon');
const { Course, Progress } = require('../models/Course');
const { generateCertificate, generateCourseCertificate } = require('../utils/pdf');

function sendPDF(res, buffer, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  res.send(buffer);
}

// Event participation cert
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).render('error', { title: 'Not Found', message: 'Event not found', user: req.user });
    const attended = await Attendance.findOne({ event: event._id, user: req.user._id });
    if (!attended) return res.status(403).render('error', { title: 'Not Available', message: 'Attend the event first.', user: req.user });
    const buf = await generateCertificate({ userName: req.user.name, eventTitle: event.title, eventDate: event.startDate, eventType: event.type, points: event.pointsReward });
    sendPDF(res, buf, `cert-${event.title.replace(/\s+/g, '-')}`);
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not generate certificate.', user: req.user });
  }
});

// Course completion cert
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).render('error', { title: 'Not Found', message: 'Course not found', user: req.user });
    const progress = await Progress.findOne({ course: course._id, user: req.user._id, isCompleted: true });
    if (!progress) return res.status(403).render('error', { title: 'Not Available', message: 'Complete the course first.', user: req.user });
    const buf = await generateCourseCertificate({ userName: req.user.name, courseTitle: course.title, category: course.category, completedDate: progress.completedAt, points: course.pointsReward });
    sendPDF(res, buf, `cert-${course.title.replace(/\s+/g, '-')}`);
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not generate certificate.', user: req.user });
  }
});

// Quiz completion certificate (passed only)
router.get('/quiz/:quizId/attempt/:attemptId', authenticate, async (req, res) => {
  try {
    const { Quiz, QuizAttempt } = require('../models/Quiz');
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).render('error', { title: 'Not Found', message: 'Quiz not found', user: req.user });
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt || attempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).render('error', { title: 'Access Denied', message: 'Certificate not available.', user: req.user });
    }
    if (!attempt.isPassed) {
      return res.status(403).render('error', { title: 'Not Eligible', message: 'You must pass the quiz to get a certificate.', user: req.user });
    }
    const buf = await generateCertificate({
      userName: req.user.name,
      eventTitle: quiz.title,
      eventDate: attempt.submittedAt || attempt.createdAt,
      eventType: 'Quiz Completion',
      points: attempt.pointsEarned || quiz.pointsReward,
    });
    sendPDF(res, buf, `quiz-cert-${quiz.title.replace(/\s+/g, '-')}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Error', message: 'Could not generate certificate.', user: req.user });
  }
});

// Hackathon participation cert
router.get('/hackathon/:hackathonId/participation', authenticate, async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon) return res.status(404).render('error', { title: 'Not Found', message: 'Hackathon not found', user: req.user });
    const team = await Team.findOne({ hackathon: hackathon._id, $or: [{ leader: req.user._id }, { 'members.user': req.user._id }] });
    if (!team) return res.status(403).render('error', { title: 'Not Available', message: 'Participate in the hackathon first.', user: req.user });
    const buf = await generateCertificate({ userName: req.user.name, eventTitle: hackathon.title, eventDate: hackathon.hackathonStart, eventType: 'Hackathon', points: hackathon.pointsReward });
    sendPDF(res, buf, `hackathon-cert-${hackathon.title.replace(/\s+/g, '-')}`);
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not generate certificate.', user: req.user });
  }
});

// Hackathon winner cert (position 1,2,3)
router.get('/hackathon/:hackathonId/winner/:position', authenticate, async (req, res) => {
  try {
    const position = parseInt(req.params.position);
    if (![1, 2, 3].includes(position)) return res.status(400).render('error', { title: 'Invalid', message: 'Invalid position', user: req.user });
    const hackathon = await Hackathon.findById(req.params.hackathonId);
    const submissions = await Submission.find({ hackathon: hackathon._id })
      .populate({ path: 'team', populate: { path: 'leader members.user', select: 'name _id' } })
      .sort({ averageScore: -1 });
    if (submissions.length < position) return res.status(404).render('error', { title: 'Not Found', message: 'Not enough submissions', user: req.user });
    const winnerSub = submissions[position - 1];
    const team = winnerSub.team;
    const isInTeam = team.leader._id.toString() === req.user._id.toString() ||
      team.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isInTeam) return res.status(403).render('error', { title: 'Access Denied', message: 'Only winning team members can download.', user: req.user });
    const prizes = hackathon.prizes?.[position - 1];
    const buf = await generateWinnerCertificate({ userName: req.user.name, hackathonTitle: hackathon.title, position, teamName: team.name, projectTitle: winnerSub.projectTitle, eventDate: hackathon.hackathonStart, prize: prizes?.amount });
    sendPDF(res, buf, `winner-${position}-${hackathon.title.replace(/\s+/g, '-')}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Error', message: 'Could not generate winner certificate.', user: req.user });
  }
});

// ─── Winner Certificate PDF Generator ────────────────────────────────────────
function generateWinnerCertificate({ userName, hackathonTitle, position, teamName, projectTitle, eventDate, prize }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 50, bottom: 50, left: 60, right: 60 } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    const W = doc.page.width, H = doc.page.height;
    const accent = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }[position] || '#39FF14';
    const medal = { 1: '🥇 1ST PLACE WINNER', 2: '🥈 2ND PLACE WINNER', 3: '🥉 3RD PLACE RUNNER-UP' }[position];

    doc.rect(0, 0, W, H).fill('#000');
    doc.rect(20, 20, W - 40, H - 40).lineWidth(2).strokeColor(accent).stroke();
    doc.rect(28, 28, W - 56, H - 56).lineWidth(0.5).strokeColor(accent + '50').stroke();
    [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]].forEach(([x, y]) => doc.circle(x, y, 4).fill(accent));

    doc.font('Helvetica').fontSize(8).fillColor('#555').text('TECHNOPHILES · GCETTB OFFICIAL TECH CLUB', 0, 42, { align: 'center', characterSpacing: 3 });
    doc.font('Helvetica-Bold').fontSize(26).fillColor(accent).text(medal, 0, 62, { align: 'center', characterSpacing: 2 });
    doc.font('Helvetica').fontSize(12).fillColor('#888').text('This is to proudly certify that', 0, 108, { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(36).fillColor('#fff').text(userName, 0, 128, { align: 'center' });
    doc.moveTo(W / 2 - 140, 172).lineTo(W / 2 + 140, 172).lineWidth(0.5).strokeColor(accent + '60').stroke();
    doc.font('Helvetica').fontSize(12).fillColor('#aaa').text('representing team', 0, 184, { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#fff').text(`"${teamName}"`, 0, 202, { align: 'center' });
    doc.font('Helvetica').fontSize(12).fillColor('#888').text('achieved the above position at', 0, 234, { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#fff').text(`"${hackathonTitle}"`, 0, 254, { align: 'center' });
    if (projectTitle) doc.font('Helvetica').fontSize(11).fillColor('#666').text(`Project: ${projectTitle}`, 0, 284, { align: 'center' });
    if (prize) {
      doc.roundedRect(W / 2 - 70, 302, 140, 28, 4).fill(accent + '20').stroke(accent + '40');
      doc.font('Helvetica-Bold').fontSize(13).fillColor(accent).text(`Prize: ${prize}`, W / 2 - 70, 311, { width: 140, align: 'center' });
    }
    doc.font('Helvetica').fontSize(10).fillColor('#555').text(new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 0, 342, { align: 'center' });

    const sigY = H - 98;
    doc.moveTo(80, sigY).lineTo(220, sigY).lineWidth(0.5).strokeColor('#333').stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#777').text('Club President', 80, sigY + 8, { width: 140, align: 'center' });
    doc.moveTo(W - 220, sigY).lineTo(W - 80, sigY).lineWidth(0.5).strokeColor('#333').stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#777').text('Faculty Advisor', W - 220, sigY + 8, { width: 140, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#222').text(`ID: HACK-WIN-${Date.now().toString(36).toUpperCase()}`, 0, H - 38, { align: 'center' });
    doc.end();
  });
}

// ─── Certificate Templates (Admin) ───────────────────────────────────────────
router.get('/templates', authenticate, async (req, res) => {
  try {
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).render('error', { title: 'Access Denied', message: 'Admin only.', user: req.user });
    }
    const { CertTemplate } = require('../models/extras');
    const templates = await CertTemplate.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.render('admin/cert-templates', { title: 'Certificate Templates', templates, user: req.user, query: req.query });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

router.post('/templates', authenticate, async (req, res) => {
  try {
    if (!['superadmin', 'admin'].includes(req.user.role)) return res.redirect('/dashboard');
    const { CertTemplate } = require('../models/extras');
    const { name, type, backgroundImage, applyToType, applyToId } = req.body;
    if (!name || !type) return res.redirect('/certificates/templates?error=missing');

    // Parse overlay field positions from form
    const fieldKeys = ['participant_name', 'event_title', 'date'];
    const fieldLabels = { participant_name: 'Participant Name', event_title: 'Event / Award Title', date: 'Date' };
    const fields = fieldKeys.map(key => ({
      key,
      label: fieldLabels[key],
      x: parseFloat(req.body[`field_x_${key}`]) || (key === 'participant_name' ? 50 : 50),
      y: parseFloat(req.body[`field_y_${key}`]) || (key === 'participant_name' ? 45 : key === 'event_title' ? 58 : 68),
      fontSize: parseInt(req.body[`field_size_${key}`]) || (key === 'participant_name' ? 28 : 16),
      fontColor: req.body[`field_color_${key}`] || '#ffffff',
      align: req.body[`field_align_${key}`] || 'center',
      fontWeight: req.body[`field_weight_${key}`] || (key === 'participant_name' ? '700' : '400'),
    }));

    // Build appliesTo array
    const appliesTo = [];
    if (applyToType && applyToType !== 'none') {
      if (applyToId && applyToId.trim()) {
        appliesTo.push({ entityType: applyToType, entityId: applyToId });
      } else {
        appliesTo.push({ entityType: applyToType });
      }
    }

    await CertTemplate.create({
      name, type,
      backgroundImage: backgroundImage || '',
      fields,
      appliesTo,
      createdBy: req.user._id,
    });
    res.redirect('/certificates/templates?msg=created');
  } catch (err) {
    console.error('[CERT TEMPLATE SAVE ERROR]', err);
    res.redirect('/certificates/templates?error=' + encodeURIComponent(err.message));
  }
});

router.delete('/templates/:id', authenticate, async (req, res) => {
  try {
    if (!['superadmin', 'admin'].includes(req.user.role)) return res.redirect('/dashboard');
    const { CertTemplate } = require('../models/extras');
    await CertTemplate.findByIdAndDelete(req.params.id);
    res.redirect('/certificates/templates?msg=deleted');
  } catch (err) {
    res.redirect('/certificates/templates');
  }
});

module.exports = router;
