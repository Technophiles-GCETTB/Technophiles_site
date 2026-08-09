// routes/sponsors.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sponsorController');
const { authenticate, requirePermission, optionalAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/roles');

router.get('/', optionalAuth, ctrl.listSponsors);
router.get('/create', authenticate, requirePermission(PERMISSIONS.MANAGE_SPONSORS), ctrl.getCreateSponsor);
router.post('/', authenticate, requirePermission(PERMISSIONS.MANAGE_SPONSORS), ctrl.createSponsor);

module.exports = router;
