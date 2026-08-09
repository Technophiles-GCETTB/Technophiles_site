const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/liveClassController');
const { authenticate, requirePermission, optionalAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/roles');

router.get('/', optionalAuth, ctrl.listLiveClasses);
router.get('/create', authenticate, requirePermission(PERMISSIONS.CREATE_EVENT), ctrl.getCreate);
router.post('/', authenticate, requirePermission(PERMISSIONS.CREATE_EVENT), ctrl.createLiveClass);
router.get('/:id', optionalAuth, ctrl.getLiveClass);
router.get('/:id/edit', authenticate, requirePermission(PERMISSIONS.EDIT_EVENT), ctrl.getEdit);
router.put('/:id', authenticate, requirePermission(PERMISSIONS.EDIT_EVENT), ctrl.updateLiveClass);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.DELETE_EVENT), ctrl.deleteLiveClass);
router.post('/:id/register', authenticate, ctrl.register);
router.post('/:id/notify', authenticate, requirePermission(PERMISSIONS.CREATE_EVENT), ctrl.sendStartNotification);
router.post('/:id/post-class', authenticate, requirePermission(PERMISSIONS.EDIT_EVENT), ctrl.updatePostClass);
router.post('/:id/attend', authenticate, ctrl.markAttendance);

module.exports = router;
