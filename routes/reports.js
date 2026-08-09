const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const { Attendance } = require('../models/index');
const { Progress } = require('../models/Course');
const { QuizAttempt } = require('../models/Quiz');
const Event = require('../models/Event');

// GET /reports/progress — Download personal progress report
router.get('/progress', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const [attendanceRecords, courseProgress, quizAttempts] = await Promise.all([
      Attendance.find({ user: user._id }).populate('event', 'title startDate pointsReward').limit(50),
      Progress.find({ user: user._id }).populate('course', 'title category level pointsReward').limit(20),
      QuizAttempt.find({ user: user._id }).populate('quiz', 'title totalMarks').sort({ createdAt: -1 }).limit(20),
    ]);

    const totalEvents = await Event.countDocuments({ 'participants.user': user._id });
    const attendedEvents = attendanceRecords.length;
    const attendancePct = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0;
    const completedCourses = courseProgress.filter(p => p.isCompleted).length;
    const passedQuizzes = quizAttempts.filter(a => a.isPassed).length;

    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 60, right: 60 } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="progress-report-${user.name.replace(/\s+/g,'-').toLowerCase()}.pdf"`);
      res.send(buf);
    });

    const W = doc.page.width;
    const green = '#39FF14';
    const dark = '#111111';

    // Header band
    doc.rect(0, 0, W, 100).fill(dark);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(green)
      .text('TECHNOPHILES · GCETTB', 60, 28, { characterSpacing: 3 });
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#FFFFFF')
      .text('PROGRESS REPORT', 60, 44);
    doc.font('Helvetica').fontSize(10).fillColor('#888888')
      .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 60, 74);

    // Student info
    doc.rect(0, 100, W, 70).fill('#0a0a0a');
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF').text(user.name, 60, 115);
    const meta = [user.email, user.role?.toUpperCase(), user.college, user.branch && `${user.branch} · Year ${user.year || ''}`].filter(Boolean).join('  ·  ');
    doc.font('Helvetica').fontSize(9).fillColor('#666666').text(meta, 60, 138);

    // Stat boxes
    const stats = [
      { label: 'TOTAL POINTS', value: user.points || 0, color: green },
      { label: 'EVENTS ATTENDED', value: `${attendedEvents}/${totalEvents}`, color: '#60a5fa' },
      { label: 'COURSES', value: `${completedCourses}/${courseProgress.length}`, color: '#a78bfa' },
      { label: 'QUIZZES PASSED', value: `${passedQuizzes}/${quizAttempts.length}`, color: '#fbbf24' },
    ];
    const boxW = (W - 120 - 30) / 4;
    stats.forEach((s, i) => {
      const x = 60 + i * (boxW + 10);
      doc.rect(x, 185, boxW, 60).fill('#0f0f0f').stroke('#1a1a1a');
      doc.font('Helvetica-Bold').fontSize(20).fillColor(s.color).text(String(s.value), x, 198, { width: boxW, align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#666666').text(s.label, x, 225, { width: boxW, align: 'center', characterSpacing: 1 });
    });

    let y = 270;

    // Section helper
    const section = (title) => {
      doc.rect(60, y, W - 120, 22).fill('#0a0a0a');
      doc.font('Helvetica-Bold').fontSize(9).fillColor(green).text(title, 68, y + 7, { characterSpacing: 2 });
      y += 30;
    };

    const row = (cols, widths, isHeader = false) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 50; }
      cols.forEach((text, i) => {
        const x = 60 + widths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(isHeader ? 8 : 9)
          .fillColor(isHeader ? '#555555' : '#cccccc')
          .text(String(text).substring(0, 40), x, y, { width: widths[i] - 4 });
      });
      if (!isHeader) { doc.rect(60, y + 14, W - 120, 0.5).fill('#111111'); }
      y += isHeader ? 16 : 18;
    };

    // Attendance section
    section('ATTENDANCE HISTORY');
    doc.font('Helvetica').fontSize(9).fillColor('#888888')
      .text(`Attendance rate: ${attendancePct}% (${attendedEvents} of ${totalEvents} events)`, 60, y);
    y += 20;
    if (attendanceRecords.length > 0) {
      row(['EVENT', 'DATE', 'POINTS'], [250, 130, 80], true);
      attendanceRecords.slice(0, 15).forEach(a => {
        row([a.event?.title || 'Unknown', new Date(a.markedAt).toLocaleDateString('en-IN'), `+${a.event?.pointsReward || 0}`], [250, 130, 80]);
      });
    } else {
      doc.font('Helvetica').fontSize(9).fillColor('#555').text('No attendance records', 68, y); y += 20;
    }
    y += 10;

    // Courses section
    section('COURSE PROGRESS');
    if (courseProgress.length > 0) {
      row(['COURSE', 'CATEGORY', 'PROGRESS', 'STATUS'], [190, 100, 80, 70], true);
      courseProgress.forEach(p => {
        row([p.course?.title || 'Unknown', (p.course?.category || '').replace('_', ' '), `${p.progressPercent}%`, p.isCompleted ? 'COMPLETE' : 'IN PROGRESS'], [190, 100, 80, 70]);
      });
    } else {
      doc.font('Helvetica').fontSize(9).fillColor('#555').text('No courses enrolled', 68, y); y += 20;
    }
    y += 10;

    // Quiz section
    section('QUIZ HISTORY');
    if (quizAttempts.length > 0) {
      row(['QUIZ', 'SCORE', 'ACCURACY', 'RESULT'], [220, 80, 80, 60], true);
      quizAttempts.slice(0, 10).forEach(a => {
        row([a.quiz?.title || 'Unknown', `${a.totalScore}/${a.quiz?.totalMarks || '?'}`, `${a.percentage}%`, a.isPassed ? 'PASS' : 'FAIL'], [220, 80, 80, 60]);
      });
    } else {
      doc.font('Helvetica').fontSize(9).fillColor('#555').text('No quiz attempts', 68, y); y += 20;
    }

    // Footer
    doc.rect(0, doc.page.height - 40, W, 40).fill('#0a0a0a');
    doc.font('Helvetica').fontSize(8).fillColor('#333333')
      .text('© Technophiles · GCETTB · This report is auto-generated', 0, doc.page.height - 24, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Report Error', message: err.message, user: req.user });
  }
});

module.exports = router;
