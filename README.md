# 🚀 Technophiles — College Tech Club Platform

A full-stack production-ready web application for managing a college tech club, featuring LMS, Hackathons, Quizzes, Events, and a Leaderboard system.

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Frontend | EJS (Server-side Rendering) |
| Database | MongoDB + Mongoose |
| Auth | JWT + HttpOnly Cookies |
| Styling | Tailwind CSS (Neon Green / Black theme) |
| QR Codes | `qrcode` npm package |
| PDF | `pdfkit` npm package |

---

## 📁 Project Structure

```
technophiles/
├── server.js                 # App entry point
├── .env.example              # Environment template
├── package.json
│
├── config/
│   ├── database.js           # MongoDB connection
│   └── roles.js              # RBAC roles & permissions
│
├── models/
│   ├── User.js               # User model with role system
│   ├── Event.js              # Events model
│   ├── Hackathon.js          # Hackathon, Team, Submission models
│   ├── Course.js             # Course, Module, Progress, Roadmap models
│   ├── Quiz.js               # Quiz, QuizAttempt models
│   └── index.js              # Attendance, Sponsor, ActivityLog, Notification, PointsTransaction
│
├── controllers/
│   ├── authController.js
│   ├── dashboardController.js
│   ├── eventController.js
│   ├── hackathonController.js
│   ├── courseController.js
│   ├── quizController.js
│   ├── adminController.js
│   ├── attendanceController.js
│   └── sponsorController.js
│
├── routes/
│   ├── index.js              # Homepage
│   ├── auth.js               # /auth/*
│   ├── dashboard.js          # /dashboard
│   ├── events.js             # /events/*
│   ├── hackathons.js         # /hackathons/*
│   ├── courses.js            # /courses/*
│   ├── quiz.js               # /quiz/*
│   ├── admin.js              # /admin/*
│   ├── sponsors.js           # /sponsors/*
│   ├── leaderboard.js        # /leaderboard
│   ├── attendance.js         # /attendance/*
│   └── api.js                # /api/* (AJAX endpoints)
│
├── middleware/
│   ├── auth.js               # JWT auth, role/permission guards
│   ├── injectUser.js         # Global user injection for templates
│   └── logger.js             # Activity logging middleware
│
├── views/                    # EJS templates
│   ├── partials/
│   │   ├── head.ejs          # HTML head + CSS/fonts
│   │   ├── navbar.ejs        # Navigation bar
│   │   └── footer.ejs        # Footer + closing tags
│   ├── index.ejs             # Homepage
│   ├── 404.ejs / error.ejs
│   ├── auth/                 # login, register, profile
│   ├── dashboard/            # Per-role dashboards
│   ├── events/               # list, detail, create, participants
│   ├── hackathons/           # list, detail, create, team, leaderboard
│   ├── courses/              # list, detail, create, learn, roadmaps
│   ├── quiz/                 # list, detail, attempt, result, scoreboard, create
│   ├── admin/                # system, users, activity
│   ├── leaderboard/          # index
│   ├── attendance/           # scan-result, my-attendance, volunteer
│   └── sponsor/              # list, create
│
├── public/
│   ├── css/main.css          # Custom styles
│   ├── js/main.js            # Client-side JS
│   └── images/               # Static images
│
└── seeds/
    └── seed.js               # Database seeder
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### 2. Clone & Install

```bash
git clone https://github.com/your-repo/technophiles.git
cd technophiles
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/technophiles
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
NODE_ENV=development
APP_URL=http://localhost:3000
COLLEGE_EMAIL_DOMAIN=gcettb.ac.in
```

### 4. Seed Database

```bash
npm run seed
```

This creates sample users, events, hackathon, courses, and quizzes.

### 5. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open: **http://localhost:3000**

---

## 👥 Login Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@gcettb.ac.in | Admin@123 |
| Admin | admin@gcettb.ac.in | Admin@123 |
| Student (Internal) | rahul@gcettb.ac.in | Student@123 |
| Event Admin | eventadmin@gcettb.ac.in | Admin@123 |
| Volunteer | volunteer@gcettb.ac.in | Admin@123 |
| Judge | judge@techcorp.com | Judge@123 |
| External User | user@gmail.com | User@123 |

---

## 🔐 Role & Access Matrix

| Feature | superadmin | admin | event_admin | volunteer | judge | internal | external |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Events | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Hackathon | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Course | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Quiz | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mark Attendance | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Judge Hackathon | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Enroll in Courses | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Take Quizzes | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Register for Events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (public) |
| View Leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 📧 Email-Based Role Auto-Assignment

During registration:
- `@gcettb.ac.in` emails → **Internal** role (full access)
- All other emails → **External** role (events & hackathons only)

Change the domain in `.env`:
```env
COLLEGE_EMAIL_DOMAIN=gcettb.ac.in
```

---

## 🏆 Points System

| Activity | Points |
|----------|--------|
| Event attendance | Event's `pointsReward` (default 10-50) |
| Module completion | Module's `pointsReward` (default 5) |
| Course completion | Course's `pointsReward` (default 50-150) |
| Quiz completion (pass) | Quiz's `pointsReward` (default 20) |
| Quiz completion (fail) | 30% of quiz points |
| Hackathon submission | 50 pts per team member |
| Hackathon win | 100+ pts based on prize |
| Admin manual award | Custom |

### Badges
| Badge | Points Required |
|-------|----------------|
| 🥉 Bronze | 50+ |
| 🥈 Silver | 200+ |
| 🥇 Gold | 500+ |
| 💎 Platinum | 1000+ |
| 👑 Diamond | 2000+ |

---

## 🗺 Key Routes

```
GET  /                        → Homepage
GET  /auth/register           → Registration
POST /auth/register           → Register user
GET  /auth/login              → Login
POST /auth/login              → Authenticate
GET  /auth/logout             → Logout
GET  /auth/profile            → View profile
POST /auth/profile            → Update profile

GET  /dashboard               → Role-based dashboard

GET  /events                  → List events
POST /events                  → Create event (admin)
GET  /events/:id              → Event detail
POST /events/:id/register     → Register for event
GET  /events/:id/participants → Manage participants (admin/volunteer)

GET  /hackathons              → List hackathons
POST /hackathons              → Create hackathon (admin)
GET  /hackathons/:id          → Hackathon detail
POST /hackathons/:id/team/create → Create team
POST /hackathons/:id/team/join   → Join team
POST /hackathons/:id/teams/:tid/submit → Submit project
GET  /hackathons/:id/leaderboard → Results

GET  /courses                 → List courses
GET  /courses/roadmaps        → Learning roadmaps
POST /courses/:id/enroll      → Enroll in course
GET  /courses/:id/learn       → Learn (module viewer)
POST /courses/:id/modules/:mid/complete → Mark module done

GET  /quiz                    → List quizzes
GET  /quiz/:id/start          → Start quiz
POST /quiz/:id/submit         → Submit quiz
GET  /quiz/:id/result/:aid    → View result

GET  /leaderboard             → Points leaderboard

GET  /attendance/scan/:token  → QR scan (mark attendance)
GET  /attendance/my           → My attendance record

GET  /admin                   → Admin system dashboard
GET  /admin/users             → Manage users
GET  /admin/activity          → Activity logs
POST /admin/notify            → Send notifications

GET  /sponsors                → Sponsors page
```

---

## 🛠 Extending the Platform

### Adding a New Role
1. Add to `config/roles.js` → `ROLES` and `ROLE_PERMISSIONS`
2. Update `User.js` enum
3. Add dashboard case in `dashboardController.js`
4. Create view in `views/dashboard/`

### Adding a New Permission
1. Add to `config/roles.js` → `PERMISSIONS`
2. Assign to relevant roles in `ROLE_PERMISSIONS`
3. Use in routes: `requirePermission(PERMISSIONS.YOUR_PERMISSION)`

---

## 📦 Production Deployment

```bash
# Set environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=very-long-random-secret

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name technophiles
pm2 save
pm2 startup
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

---

## 🤝 Contributing

Built by the Technophiles team. Contributions welcome!

1. Fork the repo
2. Create your feature branch
3. Commit changes
4. Push and open a PR
