const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { authenticate, requirePermission, optionalAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/roles');

router.get('/', optionalAuth, ctrl.listCourses);
router.get('/roadmaps', optionalAuth, ctrl.listRoadmaps);

// Course CRUD
router.get('/create', authenticate, requirePermission(PERMISSIONS.CREATE_COURSE), ctrl.getCreateCourse);
router.post('/', authenticate, requirePermission(PERMISSIONS.CREATE_COURSE), ctrl.createCourse);
router.get('/:id', optionalAuth, ctrl.getCourse);
router.get('/:id/edit', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.getEditCourse);
router.put('/:id', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.updateCourse);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.deleteCourse);

// Enrollment & learning
router.post('/:id/enroll', authenticate, ctrl.enrollCourse);
router.get('/:id/learn', authenticate, ctrl.learnCourse);
router.post('/:id/modules/:moduleId/complete', authenticate, ctrl.completeModule);

// Module management
router.get('/:id/modules/add', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.getAddModule);
router.post('/:id/modules', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.addModule);
router.get('/:id/modules/:moduleId/edit', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.getEditModule);
router.put('/:id/modules/:moduleId', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.updateModule);
router.delete('/:id/modules/:moduleId', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.deleteModule);

// Link events/live classes to course
router.post('/:id/link-event', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.linkEvent);
router.post('/:id/link-liveclass', authenticate, requirePermission(PERMISSIONS.MANAGE_COURSE), ctrl.linkLiveClass);

module.exports = router;
