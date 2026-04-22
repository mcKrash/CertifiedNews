const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, checkBanStatus } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', verifyToken, checkBanStatus, authController.getCurrentUser);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with code
 * @access  Public
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @route   POST /api/auth/preferences
 * @desc    Save user preferences (onboarding)
 * @access  Private
 */
router.post('/preferences', verifyToken, authController.savePreferences);

/**
 * @route   POST /api/auth/journalist-profile
 * @desc    Save journalist profile
 * @access  Private
 */
router.post('/journalist-profile', verifyToken, authController.saveJournalistProfile);

/**
 * @route   POST /api/auth/agency-profile
 * @desc    Save agency profile
 * @access  Private
 */
router.post('/agency-profile', verifyToken, authController.saveAgencyProfile);

/**
 * @route   POST /api/auth/google/callback
 * @desc    Google OAuth callback handler
 * @access  Public
 */
router.post('/google/callback', authController.googleCallback);

module.exports = router;
