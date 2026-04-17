const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const sources = [
    { id: 1, name: 'BBC News', reliability: 95, url: 'https://bbc.com' },
    { id: 2, name: 'Reuters', reliability: 92, url: 'https://reuters.com' },
    { id: 3, name: 'AP News', reliability: 90, url: 'https://apnews.com' }
  ];
  res.json(sources);
});

module.exports = router;
