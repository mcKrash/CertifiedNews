const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

/**
 * @route   GET /api/search
 * @desc    Search articles, categories, and sources
 * @access  Public
 */
router.get('/', searchController.search);

/**
 * @route   GET /api/search/trending
 * @desc    Get trending search terms
 * @access  Public
 */
router.get('/trending', searchController.getTrendingSearches);

module.exports = router;
