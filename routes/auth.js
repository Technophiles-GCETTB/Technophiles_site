const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, guestOnly } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.get('/register', guestOnly, authController.getRegister);
router.post('/register', guestOnly, authLimiter, authController.postRegister);
router.get('/login', guestOnly, authController.getLogin);
router.post('/login', guestOnly, authLimiter, authController.postLogin);
router.get('/logout', authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.post('/profile', authenticate, authController.updateProfile);
router.get('/forgot-password', guestOnly, authController.getForgotPassword);
router.post('/forgot-password', guestOnly, authLimiter, authController.postForgotPassword);
router.get('/reset-password/:token', guestOnly, authController.getResetPassword);
router.post('/reset-password/:token', guestOnly, authController.postResetPassword);

module.exports = router;
