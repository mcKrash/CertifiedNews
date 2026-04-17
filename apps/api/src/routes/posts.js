const express = require('express');
const router = express.Router();
const { posts } = require('../data/mockData');

router.get('/', (req, res) => {
  res.json(posts);
});

router.post('/', (req, res) => {
  const { title, content, sourceUrl } = req.body;
  const newPost = {
    id: Date.now().toString(),
    title,
    content,
    sourceUrl,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

module.exports = router;
