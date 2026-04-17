const express = require('express');
const router = express.Router();

router.get('/categories', (req, res) => {
  const categories = [
    { id: 1, name: 'All News', icon: '📰' },
    { id: 2, name: 'Sport', icon: '⚽' },
    { id: 3, name: 'Politics', icon: '🏛️' },
    { id: 4, name: 'Oceans & Forests', icon: '🌍' },
    { id: 5, name: 'Technology', icon: '💻' },
    { id: 6, name: 'Health', icon: '🏥' },
    { id: 7, name: 'Science', icon: '🔬' }
  ];
  res.json(categories);
});

router.get('/channels', (req, res) => {
  const channels = [
    { id: 1, name: 'BBC News', color: '#FF0000' },
    { id: 2, name: 'Reuters', color: '#FF9900' },
    { id: 3, name: 'AP News', color: '#FFCC00' }
  ];
  res.json(channels);
});

module.exports = router;
