const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/moderation/articles/pending
 * @desc    Get pending articles for review
 * @access  Private (ADMIN)
 */
router.get('/articles/pending', verifyToken, requireRole('ADMIN'), moderationController.getPendingArticles);

/**
 * @route   PUT /api/moderation/articles/:articleId
 * @desc    Review and approve/reject article
 * @access  Private (ADMIN)
 */
router.put('/articles/:articleId', verifyToken, requireRole('ADMIN'), moderationController.reviewArticle);

/**
 * @route   GET /api/moderation/comments/pending
 * @desc    Get pending comments for review
 * @access  Private (ADMIN)
 */
router.get('/comments/pending', verifyToken, requireRole('ADMIN'), moderationController.getPendingComments);

/**
 * @route   PUT /api/moderation/comments/:commentId
 * @desc    Moderate comment (approve/reject/ban user)
 * @access  Private (ADMIN)
 */
router.put('/comments/:commentId', verifyToken, requireRole('ADMIN'), moderationController.moderateComment);

/**
 * @route   GET /api/moderation/statistics
 * @desc    Get moderation statistics
 * @access  Private (ADMIN)
 */
router.get('/statistics', verifyToken, requireRole('ADMIN'), moderationController.getModerationStats);

module.exports = router;
