const express = require('express');
const router = express.Router();
const { articles } = require('../data/mockData');

router.get('/', (req, res) => {
  res.json(articles);
});

router.get('/:id', (req, res) => {
  const article = articles.find(a => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json(article);
});

module.exports = router;
