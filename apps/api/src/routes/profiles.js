const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   GET /api/profiles/:userId
 * @desc    Get user profile
 * @access  Public
 */
router.get('/:userId', profileController.getUserProfile);

/**
 * @route   PUT /api/profiles/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', verifyToken, profileController.updateUserProfile);

/**
 * @route   POST /api/profiles/:userId/follow
 * @desc    Follow/Unfollow user
 * @access  Private
 */
router.post('/:userId/follow', verifyToken, profileController.followUser);

/**
 * @route   GET /api/profiles/:userId/followers
 * @desc    Get user followers
 * @access  Public
 */
router.get('/:userId/followers', profileController.getUserFollowers);

/**
 * @route   GET /api/profiles/:userId/following
 * @desc    Get user following
 * @access  Public
 */
router.get('/:userId/following', profileController.getUserFollowing);

/**
 * @route   GET /api/profiles/:userId/activity
 * @desc    Get user activity feed
 * @access  Public
 */
router.get('/:userId/activity', profileController.getUserActivity);

module.exports = router;
