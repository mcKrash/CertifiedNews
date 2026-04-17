const { categories, articles, communityPosts } = require('../data/mockData');

exports.getCategories = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {
      totalArticles: articles.length,
      verifiedArticles: articles.filter(a => a.status === 'verified').length,
      underReviewArticles: articles.filter(a => a.status === 'under review' || a.status === 'pending').length,
      communityPosts: communityPosts.length,
      rejectedItems: communityPosts.filter(p => p.status === 'rejected').length,
      trustedSources: 5,
      auditEvents: 4
    };
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
