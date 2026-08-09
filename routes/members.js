const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/memberController');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const isAdmin = requireRole('superadmin', 'admin');

router.get('/', optionalAuth, ctrl.listMembers);
router.get('/admin', authenticate, isAdmin, ctrl.adminList);
router.get('/create', authenticate, isAdmin, ctrl.getCreate);
router.post('/', authenticate, isAdmin, ctrl.createMember);
router.get('/:id/edit', authenticate, isAdmin, ctrl.getEdit);
router.put('/:id', authenticate, isAdmin, ctrl.updateMember);
router.delete('/:id', authenticate, isAdmin, ctrl.deleteMember);

module.exports = router;
