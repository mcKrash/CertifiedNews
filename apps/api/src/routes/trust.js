const express = require('express');
const router = express.Router();
const trustController = require('../controllers/trustController');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/trust/article/:articleId
 * @desc    Get article trust score
 * @access  Public
 */
router.get('/article/:articleId', trustController.getArticleTrustScore);

/**
 * @route   GET /api/trust/source/:sourceId
 * @desc    Get source trust profile
 * @access  Public
 */
router.get('/source/:sourceId', trustController.getSourceTrustProfile);

/**
 * @route   PUT /api/trust/source/:sourceId
 * @desc    Update source trust score
 * @access  Private (ADMIN)
 */
router.put(
  '/source/:sourceId',
  verifyToken,
  requireRole('ADMIN'),
  trustController.updateSourceTrustScore
);

/**
 * @route   GET /api/trust/statistics
 * @desc    Get trust statistics
 * @access  Public
 */
router.get('/statistics', trustController.getTrustStatistics);

module.exports = router;
