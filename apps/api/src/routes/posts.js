const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/', postsController.getPosts);
router.get('/:postId', postsController.getPost);
router.get('/user/:userId', postsController.getUserPosts);

// Protected routes
router.post('/', verifyToken, postsController.createPost);
router.put('/:postId', verifyToken, postsController.updatePost);
router.delete('/:postId', verifyToken, postsController.deletePost);

module.exports = router;
