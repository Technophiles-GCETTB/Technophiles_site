const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─── Base email template ──────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #000; color: #e0e0e0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; border-bottom: 2px solid #39FF14; padding: 20px; text-align: center; }
    .logo { color: #39FF14; font-size: 28px; font-weight: 900; letter-spacing: 4px; }
    .body { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 30px; margin-top: 0; }
    .btn { display: inline-block; background: #39FF14; color: #000; padding: 12px 30px; text-decoration: none; font-weight: 700; border-radius: 4px; margin: 20px 0; letter-spacing: 1px; }
    .footer { text-align: center; padding: 20px; color: #555; font-size: 12px; }
    h2 { color: #39FF14; margin-top: 0; }
    p { color: #aaa; line-height: 1.6; }
    .highlight { color: #39FF14; font-weight: bold; }
    .divider { border: none; border-top: 1px solid #1a1a1a; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TECHNOPHILES</div>
      <p style="color:#555;margin:5px 0;font-size:12px;letter-spacing:2px;">GCETTB OFFICIAL TECH CLUB</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Technophiles · GCETTB Campus<br>
      This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send Email ───────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
      return { success: true, skipped: true };
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Technophiles <noreply@technophiles.com>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });

    console.log(`[EMAIL SENT] To: ${to} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | Error: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ─── Welcome Email ────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (user) => {
  const content = `
    <h2>Welcome to Technophiles, ${user.name}! 🚀</h2>
    <p>Your account has been created successfully. Here's what you can do:</p>
    <ul style="color:#aaa;line-height:2;">
      ${user.role === 'internal' ? `
        <li>📚 Enroll in <span class="highlight">courses</span> and track your progress</li>
        <li>🧠 Take <span class="highlight">quizzes</span> and earn points</li>
        <li>⚡ Join <span class="highlight">hackathons</span> and compete</li>
        <li>🏆 Climb the <span class="highlight">leaderboard</span></li>
      ` : `
        <li>📅 Register for <span class="highlight">public events</span></li>
        <li>⚡ Participate in <span class="highlight">hackathons</span></li>
      `}
    </ul>
    <a href="${process.env.APP_URL}/dashboard" class="btn">GO TO DASHBOARD →</a>
    <hr class="divider">
    <p style="font-size:13px;">Your role: <span class="highlight">${user.role.toUpperCase()}</span></p>
    ${user.role === 'external' ? `<p style="font-size:12px;color:#555;">To unlock full access (courses, quizzes, leaderboard), register with your <span class="highlight">@gcettb.ac.in</span> college email.</p>` : ''}
  `;
  return sendEmail({
    to: user.email,
    subject: `Welcome to Technophiles, ${user.name}! 🚀`,
    html: baseTemplate(content),
  });
};

// ─── Event Registration Email ─────────────────────────────────────────────────
const sendEventRegistrationEmail = async (user, event) => {
  const content = `
    <h2>Registration Confirmed! 📅</h2>
    <p>You've successfully registered for:</p>
    <div style="background:#0f0f0f;border-left:3px solid #39FF14;padding:15px;margin:15px 0;">
      <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;">${event.title}</p>
      <p style="color:#39FF14;margin:5px 0;font-size:13px;">${new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      ${event.venue ? `<p style="color:#aaa;margin:5px 0;font-size:13px;">📍 ${event.venue}</p>` : ''}
      ${event.isVirtual && event.meetingLink ? `<p style="margin:10px 0;"><a href="${event.meetingLink}" style="color:#39FF14;">🔗 Join Meeting Link</a></p>` : ''}
    </div>
    <p>You'll earn <span class="highlight">+${event.pointsReward} points</span> for attending!</p>
    <a href="${process.env.APP_URL}/events/${event._id}" class="btn">VIEW EVENT →</a>
  `;
  return sendEmail({
    to: user.email,
    subject: `Registered: ${event.title}`,
    html: baseTemplate(content),
  });
};

// ─── Hackathon Team Email ─────────────────────────────────────────────────────
const sendTeamCreatedEmail = async (user, team, hackathon) => {
  const content = `
    <h2>Team Created! ⚡</h2>
    <p>Your team <span class="highlight">${team.name}</span> has been created for <span class="highlight">${hackathon.title}</span>.</p>
    <div style="background:#0f0f0f;border:1px solid #39FF1430;padding:15px;margin:15px 0;border-radius:4px;">
      <p style="color:#555;font-size:11px;letter-spacing:2px;margin:0 0 5px;">INVITE CODE</p>
      <p style="color:#39FF14;font-size:32px;font-weight:900;letter-spacing:8px;margin:0;">${team.inviteCode}</p>
    </div>
    <p>Share this code with your teammates so they can join your team.</p>
    <a href="${process.env.APP_URL}/hackathons/${hackathon._id}/teams/${team._id}" class="btn">VIEW TEAM →</a>
  `;
  return sendEmail({
    to: user.email,
    subject: `Team "${team.name}" created for ${hackathon.title}`,
    html: baseTemplate(content),
  });
};

// ─── Quiz Result Email ────────────────────────────────────────────────────────
const sendQuizResultEmail = async (user, quiz, attempt) => {
  const content = `
    <h2>Quiz Result: ${attempt.isPassed ? '🎉 Passed!' : '📚 Keep Practising'}</h2>
    <p>Your result for <span class="highlight">${quiz.title}</span>:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:15px 0;">
      <div style="background:#0f0f0f;padding:15px;text-align:center;border:1px solid #1a1a1a;">
        <p style="color:#39FF14;font-size:24px;font-weight:900;margin:0;">${attempt.totalScore}</p>
        <p style="color:#555;font-size:11px;margin:5px 0 0;">SCORE / ${quiz.totalMarks}</p>
      </div>
      <div style="background:#0f0f0f;padding:15px;text-align:center;border:1px solid #1a1a1a;">
        <p style="color:#fff;font-size:24px;font-weight:900;margin:0;">${attempt.percentage}%</p>
        <p style="color:#555;font-size:11px;margin:5px 0 0;">ACCURACY</p>
      </div>
      <div style="background:#0f0f0f;padding:15px;text-align:center;border:1px solid #1a1a1a;">
        <p style="color:#39FF14;font-size:24px;font-weight:900;margin:0;">+${attempt.pointsEarned}</p>
        <p style="color:#555;font-size:11px;margin:5px 0 0;">POINTS</p>
      </div>
    </div>
    <a href="${process.env.APP_URL}/quiz/${quiz._id}/result/${attempt._id}" class="btn">VIEW FULL RESULT →</a>
  `;
  return sendEmail({
    to: user.email,
    subject: `Quiz Result: ${quiz.title} (${attempt.percentage}%)`,
    html: baseTemplate(content),
  });
};

// ─── Password Reset Email ─────────────────────────────────────────────────────
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password/${resetToken}`;
  const content = `
    <h2>Password Reset Request 🔐</h2>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <a href="${resetUrl}" class="btn">RESET PASSWORD →</a>
    <p style="font-size:12px;color:#555;margin-top:20px;">This link expires in <span class="highlight">1 hour</span>. If you didn't request a password reset, ignore this email.</p>
    <hr class="divider">
    <p style="font-size:11px;color:#444;">Or copy this URL: ${resetUrl}</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Password Reset - Technophiles',
    html: baseTemplate(content),
  });
};

// ─── Generic Notification Email ───────────────────────────────────────────────
const sendNotificationEmail = async (user, { title, message, link, linkText = 'VIEW DETAILS' }) => {
  const content = `
    <h2>${title}</h2>
    <p>${message}</p>
    ${link ? `<a href="${process.env.APP_URL}${link}" class="btn">${linkText} →</a>` : ''}
  `;
  return sendEmail({
    to: user.email,
    subject: `${title} - Technophiles`,
    html: baseTemplate(content),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendTeamCreatedEmail,
  sendQuizResultEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
