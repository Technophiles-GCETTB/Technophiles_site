const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pagesController');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const isAdmin = requireRole('superadmin', 'admin');

// Calendar
router.get('/calendar', optionalAuth, ctrl.getCalendar);

// Roadmaps
router.get('/roadmaps', optionalAuth, ctrl.listRoadmaps);
router.get('/roadmaps/create', authenticate, isAdmin, ctrl.getCreateRoadmap);
router.post('/roadmaps', authenticate, isAdmin, ctrl.createRoadmap);
router.get('/roadmaps/:id', optionalAuth, ctrl.getRoadmap);
router.get('/roadmaps/:id/edit', authenticate, isAdmin, ctrl.getEditRoadmap);
router.put('/roadmaps/:id', authenticate, isAdmin, ctrl.updateRoadmap);
router.delete('/roadmaps/:id', authenticate, isAdmin, ctrl.deleteRoadmap);

// About
router.get('/about', optionalAuth, ctrl.getAbout);
router.get('/about/edit', authenticate, isAdmin, ctrl.getEditAbout);
router.post('/about', authenticate, isAdmin, ctrl.updateAbout);

// Contact
router.get('/contact', optionalAuth, ctrl.getContact);
router.post('/contact', ctrl.submitContact);
router.get('/contact/messages', authenticate, isAdmin, ctrl.getContactMessages);
router.get('/contact/edit', authenticate, isAdmin, ctrl.getEditContact);
router.post('/contact/settings', authenticate, isAdmin, ctrl.updateContact);

module.exports = router;
