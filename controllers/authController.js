const User = require('../models/User');
const { ActivityLog } = require('../models/index');
const { sendWelcomeEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

// ─── Helper: Set Cookie ───────────────────────────────────────────────────────
const sendTokenCookie = (res, token) => {
  const options = {
    expires: new Date(Date.now() + (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  res.cookie('token', token, options);
};

// ─── GET /auth/register ───────────────────────────────────────────────────────
exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Register - Technophiles', error: null });
};

// ─── POST /auth/register ──────────────────────────────────────────────────────
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, college, branch, year } = req.body;

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register - Technophiles',
        error: 'Passwords do not match',
        formData: req.body
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register - Technophiles',
        error: 'Email already registered',
        formData: req.body
      });
    }

    // Auto-assign role from email
    const role = User.getRoleFromEmail(email);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      college,
      branch,
      year: year ? parseInt(year) : undefined
    });

    // Log activity
    await ActivityLog.create({
      user: user._id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user._id,
      details: { email, role }
    });

    const token = user.generateJWT();
    sendTokenCookie(res, token);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch(console.error);

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('auth/register', {
      title: 'Register - Technophiles',
      error: err.message || 'Registration failed. Please try again.',
      formData: req.body
    });
  }
};

// ─── GET /auth/login ──────────────────────────────────────────────────────────
exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login - Technophiles', error: null });
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Login - Technophiles',
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.render('auth/login', {
        title: 'Login - Technophiles',
        error: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.render('auth/login', {
        title: 'Login - Technophiles',
        error: 'Your account has been deactivated. Please contact admin.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login - Technophiles',
        error: 'Invalid email or password'
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await ActivityLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id,
      ip: req.ip
    });

    const token = user.generateJWT();
    sendTokenCookie(res, token);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('auth/login', {
      title: 'Login - Technophiles',
      error: 'Login failed. Please try again.'
    });
  }
};

// ─── GET /auth/logout ─────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
};

// ─── GET /auth/profile ────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('enrolledCourses', 'title thumbnail')
      .populate('registeredEvents', 'title startDate');
    res.render('auth/profile', { title: 'My Profile', user });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

// ─── POST /auth/profile ───────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, college, branch, year, github, linkedin } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      name, bio, phone, college, branch,
      year: year ? parseInt(year) : undefined,
      github, linkedin
    });
    res.redirect('/auth/profile');
  } catch (err) {
    console.error(err);
    res.redirect('/auth/profile');
  }
};

// ─── GET /auth/forgot-password ────────────────────────────────────────────────
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password', error: null, success: null });
};

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always show success to prevent email enumeration
    if (!user) {
      return res.render('auth/forgot-password', {
        title: 'Forgot Password',
        error: null,
        success: 'If that email exists, a reset link has been sent.'
      });
    }
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const { sendPasswordResetEmail } = require('../utils/email');
    await sendPasswordResetEmail(user, resetToken);

    res.render('auth/forgot-password', {
      title: 'Forgot Password',
      error: null,
      success: 'Reset link sent! Check your email.'
    });
  } catch (err) {
    console.error(err);
    res.render('auth/forgot-password', {
      title: 'Forgot Password',
      error: 'Something went wrong. Please try again.',
      success: null
    });
  }
};

// ─── GET /auth/reset-password/:token ──────────────────────────────────────────
exports.getResetPassword = async (req, res) => {
  try {
    const crypto = require('crypto');
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) {
      return res.render('auth/reset-password', {
        title: 'Reset Password',
        error: 'Reset link is invalid or has expired.',
        token: null
      });
    }
    res.render('auth/reset-password', { title: 'Reset Password', error: null, token: req.params.token });
  } catch (err) {
    res.redirect('/auth/forgot-password');
  }
};

// ─── POST /auth/reset-password/:token ─────────────────────────────────────────
exports.postResetPassword = async (req, res) => {
  try {
    const crypto = require('crypto');
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) {
      return res.render('auth/reset-password', {
        title: 'Reset Password',
        error: 'Reset link is invalid or has expired.',
        token: req.params.token
      });
    }
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.render('auth/reset-password', {
        title: 'Reset Password',
        error: 'Passwords do not match.',
        token: req.params.token
      });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.generateJWT();
    sendTokenCookie(res, token);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/auth/forgot-password');
  }
};
