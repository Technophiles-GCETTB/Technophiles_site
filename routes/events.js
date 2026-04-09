const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventController');
const { authenticate, requirePermission, optionalAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/roles');

router.get('/', optionalAuth, ctrl.listEvents);
router.get('/create', authenticate, requirePermission(PERMISSIONS.CREATE_EVENT), ctrl.getCreateEvent);
router.post('/', authenticate, requirePermission(PERMISSIONS.CREATE_EVENT), ctrl.createEvent);
router.get('/:id', optionalAuth, ctrl.getEvent);
router.get('/:id/edit', authenticate, requirePermission(PERMISSIONS.EDIT_EVENT), ctrl.getEditEvent);
router.put('/:id', authenticate, requirePermission(PERMISSIONS.EDIT_EVENT), ctrl.updateEvent);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.DELETE_EVENT), ctrl.deleteEvent);
router.post('/:id/register', authenticate, ctrl.registerForEvent);
router.get('/:id/participants', authenticate, requirePermission(PERMISSIONS.VIEW_ATTENDANCE), ctrl.getParticipants);

module.exports = router;
