const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   POST /api/votes
 * @desc    Toggle vote on article or post
 * @access  Private
 */
router.post('/', verifyToken, voteController.toggleVote);

/**
 * @route   GET /api/votes/count
 * @desc    Get vote count for article or post
 * @access  Public
 */
router.get('/count', voteController.getVoteCount);

module.exports = router;
