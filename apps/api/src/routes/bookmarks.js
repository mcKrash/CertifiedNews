const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   POST /api/bookmarks
 * @desc    Toggle bookmark on article
 * @access  Private
 */
router.post('/', verifyToken, bookmarkController.toggleBookmark);

/**
 * @route   GET /api/bookmarks
 * @desc    Get user's bookmarks
 * @access  Private
 */
router.get('/', verifyToken, bookmarkController.getUserBookmarks);

/**
 * @route   GET /api/bookmarks/check
 * @desc    Check if article is bookmarked
 * @access  Private
 */
router.get('/check', verifyToken, bookmarkController.isBookmarked);

module.exports = router;
