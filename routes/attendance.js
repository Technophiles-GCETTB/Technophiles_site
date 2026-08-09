const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/roles');

router.get('/scan/:qrToken', authenticate, ctrl.scanQR);
router.get('/my', authenticate, ctrl.getMyAttendance);
router.get('/volunteer', authenticate, requirePermission(PERMISSIONS.MARK_ATTENDANCE), ctrl.getVolunteerPanel);
router.post('/manual', authenticate, requirePermission(PERMISSIONS.MARK_ATTENDANCE), ctrl.markManual);

module.exports = router;
