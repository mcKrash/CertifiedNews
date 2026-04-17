const express = require('express');
const router = express.Router();

router.get('/status/:articleId', (req, res) => {
  const status = {
    articleId: req.params.articleId,
    verified: true,
    trustScore: 85,
    sources: 3,
    lastUpdated: new Date().toISOString()
  };
  res.json(status);
});

router.post('/report', (req, res) => {
  const { articleId, reason } = req.body;
  res.status(201).json({
    id: Date.now().toString(),
    articleId,
    reason,
    status: 'submitted',
    createdAt: new Date().toISOString()
  });
});

module.exports = router;
