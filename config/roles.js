// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  EVENT_ADMIN: 'event_admin',
  VOLUNTEER: 'volunteer',
  JUDGE: 'judge',
  SPONSOR: 'sponsor',
  INTERNAL: 'internal',
  EXTERNAL: 'external'
};

// ─── Permissions ──────────────────────────────────────────────────────────────
const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',

  // Event Management
  CREATE_EVENT: 'create_event',
  EDIT_EVENT: 'edit_event',
  DELETE_EVENT: 'delete_event',
  VIEW_EVENT: 'view_event',

  // Hackathon
  CREATE_HACKATHON: 'create_hackathon',
  MANAGE_HACKATHON: 'manage_hackathon',
  JUDGE_HACKATHON: 'judge_hackathon',

  // Course & Quiz
  CREATE_COURSE: 'create_course',
  MANAGE_COURSE: 'manage_course',
  CREATE_QUIZ: 'create_quiz',
  TAKE_QUIZ: 'take_quiz',

  // Attendance
  SCAN_QR: 'scan_qr',
  MARK_ATTENDANCE: 'mark_attendance',
  VIEW_ATTENDANCE: 'view_attendance',

  // Analytics & Reports
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_REPORTS: 'export_reports',

  // System
  MANAGE_SYSTEM: 'manage_system',
  MANAGE_ADMINS: 'manage_admins',
  VIEW_LEADERBOARD: 'view_leaderboard',

  // Sponsor
  MANAGE_SPONSORS: 'manage_sponsors',
};

// ─── Role → Permissions Map ───────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: Object.values(PERMISSIONS), // All permissions

  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.EDIT_EVENT,
    PERMISSIONS.DELETE_EVENT,
    PERMISSIONS.VIEW_EVENT,
    PERMISSIONS.CREATE_HACKATHON,
    PERMISSIONS.MANAGE_HACKATHON,
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.MANAGE_COURSE,
    PERMISSIONS.CREATE_QUIZ,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_LEADERBOARD,
    PERMISSIONS.MANAGE_SPONSORS,
  ],

  [ROLES.EVENT_ADMIN]: [
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.EDIT_EVENT,
    PERMISSIONS.VIEW_EVENT,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_LEADERBOARD,
  ],

  [ROLES.VOLUNTEER]: [
    PERMISSIONS.SCAN_QR,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_EVENT,
  ],

  [ROLES.JUDGE]: [
    PERMISSIONS.JUDGE_HACKATHON,
    PERMISSIONS.VIEW_EVENT,
  ],

  [ROLES.SPONSOR]: [
    PERMISSIONS.VIEW_EVENT,
    PERMISSIONS.VIEW_LEADERBOARD,
  ],

  [ROLES.INTERNAL]: [
    PERMISSIONS.VIEW_EVENT,
    PERMISSIONS.TAKE_QUIZ,
    PERMISSIONS.VIEW_LEADERBOARD,
    PERMISSIONS.VIEW_ATTENDANCE,
  ],

  [ROLES.EXTERNAL]: [
    PERMISSIONS.VIEW_EVENT,
  ],
};

// ─── Role Hierarchy (higher = more privilege) ─────────────────────────────────
const ROLE_HIERARCHY = {
  [ROLES.SUPERADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.EVENT_ADMIN]: 60,
  [ROLES.VOLUNTEER]: 40,
  [ROLES.JUDGE]: 40,
  [ROLES.SPONSOR]: 30,
  [ROLES.INTERNAL]: 20,
  [ROLES.EXTERNAL]: 10,
};

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS, ROLE_HIERARCHY };
