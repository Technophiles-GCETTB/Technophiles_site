const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hackathonController');
const { authenticate, requirePermission, optionalAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/roles');

router.get('/', optionalAuth, ctrl.listHackathons);
router.get('/create', authenticate, requirePermission(PERMISSIONS.CREATE_HACKATHON), ctrl.getCreateHackathon);
router.post('/', authenticate, requirePermission(PERMISSIONS.CREATE_HACKATHON), ctrl.createHackathon);
router.get('/:id', optionalAuth, ctrl.getHackathon);
router.post('/:id/team/create', authenticate, ctrl.createTeam);
router.post('/:id/team/join', authenticate, ctrl.joinTeam);
router.get('/:id/teams/:teamId', authenticate, ctrl.getTeam);
router.post('/:id/teams/:teamId/submit', authenticate, ctrl.submitProject);
router.get('/:id/judge', authenticate, requirePermission(PERMISSIONS.JUDGE_HACKATHON), ctrl.getJudgePanel);
router.post('/:id/submissions/:submissionId/score', authenticate, requirePermission(PERMISSIONS.JUDGE_HACKATHON), ctrl.scoreSubmission);
router.get('/:id/leaderboard', optionalAuth, ctrl.getLeaderboard);

module.exports = router;
