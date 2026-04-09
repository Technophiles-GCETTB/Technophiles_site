const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/quizController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/roles');

router.get('/', authenticate, ctrl.listQuizzes);
router.get('/create', authenticate, requirePermission(PERMISSIONS.CREATE_QUIZ), ctrl.getCreateQuiz);
router.post('/', authenticate, requirePermission(PERMISSIONS.CREATE_QUIZ), ctrl.createQuiz);
router.get('/:id', authenticate, ctrl.getQuiz);
router.get('/:id/start', authenticate, ctrl.startQuiz);
router.post('/:id/submit', authenticate, ctrl.submitQuiz);
router.get('/:id/result/:attemptId', authenticate, ctrl.getResult);
router.get('/:id/scoreboard', authenticate, ctrl.getScoreboard);

module.exports = router;
