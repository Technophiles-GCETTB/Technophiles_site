require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const morgan = require('morgan');
const path = require('path');

const app = express();

// ─── Database Connection ──────────────────────────────────────────────────────
require('./config/database');

// ─── View Engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Global template variables ────────────────────────────────────────────────
const { injectUser } = require('./middleware/injectUser');
app.use(injectUser);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/events', require('./routes/events'));
app.use('/hackathons', require('./routes/hackathons'));
app.use('/courses', require('./routes/courses'));
app.use('/quiz', require('./routes/quiz'));
app.use('/admin', require('./routes/admin'));
app.use('/sponsors', require('./routes/sponsors'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/attendance', require('./routes/attendance'));
app.use('/api', require('./routes/api'));
app.use('/admin/settings', require('./routes/settings'));
app.use('/push', require('./routes/push'));
app.use('/certificates', require('./routes/certificates'));
app.use('/reports', require('./routes/reports'));
app.use('/live-classes', require('./routes/live-classes'));
app.use('/members', require('./routes/members'));
app.use('/projects', require('./routes/projects'));
app.use('/', require('./routes/pages'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Not Found' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', {
    title: 'Error',
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Technophiles Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
