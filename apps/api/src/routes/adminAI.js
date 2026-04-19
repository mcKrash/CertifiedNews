const express = require('express');
const router = express.Router();
const adminAIController = require('../controllers/adminAIController');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * @route   POST /api/admin/ai/analyze-article
 * @desc    AI analysis for article moderation
 * @access  Private (ADMIN)
 */
router.post('/analyze-article', verifyToken, requireRole('ADMIN'), adminAIController.analyzeArticle);

/**
 * @route   POST /api/admin/ai/analyze-application
 * @desc    AI analysis for reporter applications
 * @access  Private (ADMIN)
 */
router.post('/analyze-application', verifyToken, requireRole('ADMIN'), adminAIController.analyzeApplication);

module.exports = router;
