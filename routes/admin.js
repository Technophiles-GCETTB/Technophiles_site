const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

const isAdmin = requireRole('superadmin', 'admin');

router.use(authenticate, isAdmin);

router.get('/', ctrl.getSystemStats);
router.get('/users', ctrl.listUsers);
router.put('/users/:id/role', ctrl.updateUserRole);
router.put('/users/:id/toggle', ctrl.toggleUserStatus);
router.delete('/users/:id', requireRole('superadmin'), ctrl.deleteUser);
router.post('/users/award-points', ctrl.awardPoints);
router.get('/activity', ctrl.getActivityLogs);
router.post('/notify', ctrl.sendNotification);

module.exports = router;
