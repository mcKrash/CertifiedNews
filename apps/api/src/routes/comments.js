const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middleware/auth');
const { validateComment, handleValidationErrors } = require('../middleware/validation');

/**
 * @route   POST /api/comments
 * @desc    Create new comment
 * @access  Private
 */
router.post('/', verifyToken, validateComment, handleValidationErrors, commentController.createComment);

/**
 * @route   GET /api/comments
 * @desc    Get comments for article or post
 * @access  Public
 */
router.get('/', commentController.getComments);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment
 * @access  Private
 */
router.delete('/:id', verifyToken, commentController.deleteComment);

module.exports = router;
