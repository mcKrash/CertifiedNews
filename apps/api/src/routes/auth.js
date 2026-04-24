const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, checkBanStatus } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/register/request-otp', authController.requestRegistrationOtp);
router.post('/register/resend-otp', authController.resendRegistrationOtp);
router.post('/register/verify-otp', authController.verifyRegistrationOtp);
router.post('/login', authController.login);
router.get('/me', verifyToken, checkBanStatus, authController.getCurrentUser);
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification-email', verifyToken, authController.resendVerificationEmail);
router.post('/preferences', verifyToken, authController.savePreferences);
router.post('/journalist-profile', verifyToken, authController.saveJournalistProfile);
router.post('/agency-profile', verifyToken, authController.saveAgencyProfile);
router.post('/google/callback', authController.googleCallback);

module.exports = router;
