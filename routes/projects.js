const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projectController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, ctrl.listProjects);
router.get('/submit', authenticate, ctrl.getCreate);
router.post('/', authenticate, ctrl.createProject);
router.get('/:id', optionalAuth, ctrl.getProject);
router.get('/:id/edit', authenticate, ctrl.getEdit);
router.put('/:id', authenticate, ctrl.updateProject);
router.delete('/:id', authenticate, ctrl.deleteProject);
router.post('/:id/like', authenticate, ctrl.toggleLike);

module.exports = router;
