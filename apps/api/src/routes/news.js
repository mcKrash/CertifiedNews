const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   GET /api/news/category
 * @desc    Get news articles by category
 * @access  Public
 */
router.get('/category', newsController.getNewsByCategory);

/**
 * @route   GET /api/news/search
 * @desc    Search news articles
 * @access  Public
 */
router.get('/search', newsController.searchNews);

/**
 * @route   GET /api/news/trending
 * @desc    Get trending news articles
 * @access  Public
 */
router.get('/trending', newsController.getTrendingNews);

/**
 * @route   GET /api/news/feed
 * @desc    Get mixed feed (user posts + news articles)
 * @access  Private
 */
router.get('/feed', verifyToken, newsController.getMixedFeed);

module.exports = router;
