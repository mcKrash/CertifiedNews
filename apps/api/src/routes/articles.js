const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateArticle, handleValidationErrors } = require('../middleware/validation');

/**
 * @route   GET /api/articles
 * @desc    Get all articles with filtering and pagination
 * @access  Public
 */
router.get('/', articleController.getArticles);

/**
 * @route   GET /api/articles/trending
 * @desc    Get trending articles
 * @access  Public
 */
router.get('/trending', articleController.getTrendingArticles);

/**
 * @route   GET /api/articles/:id
 * @desc    Get single article by ID
 * @access  Public
 */
router.get('/:id', articleController.getArticleById);

/**
 * @route   POST /api/articles
 * @desc    Create new article
 * @access  Private (REPORTER, ADMIN)
 */
router.post(
  '/',
  verifyToken,
  requireRole('REPORTER', 'ADMIN'),
  validateArticle,
  handleValidationErrors,
  articleController.createArticle
);

module.exports = router;
