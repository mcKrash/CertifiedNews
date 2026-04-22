const { PrismaClient } = require('@prisma/client');
const guardianApi = require('../services/guardianApi');

const prisma = new PrismaClient();

/**
 * Get news articles by category
 */
const getNewsByCategory = async (req, res) => {
  try {
    const { category = 'world', page = 1, limit = 10 } = req.query;

    const result = await guardianApi.fetchArticles(category, parseInt(page), parseInt(limit));

    if (result.error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch news articles',
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      data: result.articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error) {
    console.error('Get news by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news articles',
      error: error.message,
    });
  }
};

/**
 * Search news articles
 */
const searchNews = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await guardianApi.searchArticles(query, parseInt(page), parseInt(limit));

    if (result.error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to search news articles',
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      data: result.articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error) {
    console.error('Search news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search news articles',
      error: error.message,
    });
  }
};

/**
 * Get trending articles
 */
const getTrendingNews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await guardianApi.getTrendingArticles(parseInt(limit));

    if (result.error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch trending articles',
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      data: result.articles,
    });
  } catch (error) {
    console.error('Get trending news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending articles',
      error: error.message,
    });
  }
};

/**
 * Get mixed feed (user posts + news articles)
 */
const getMixedFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, categories = [] } = req.query;
    const userId = req.user?.id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch user posts
    let userPostsQuery = {
      skip,
      take: Math.ceil(parseInt(limit) / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            userType: true,
            isVerified: true,
          },
        },
        votes: userId ? { where: { userId } } : false,
        comments: true,
      },
    };

    const userPosts = await prisma.post.findMany(userPostsQuery);

    // Fetch news articles from Guardian API
    const categoryList = Array.isArray(categories) ? categories : [categories || 'world'];
    const newsArticles = [];

    for (const category of categoryList) {
      const result = await guardianApi.fetchArticles(category, 1, Math.ceil(parseInt(limit) / 2));
      newsArticles.push(...result.articles);
    }

    // Combine and interleave posts and articles
    const mixedFeed = [];
    const maxLength = Math.max(userPosts.length, newsArticles.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < userPosts.length) {
        mixedFeed.push({
          type: 'post',
          data: {
            id: userPosts[i].id,
            content: userPosts[i].content,
            images: userPosts[i].images,
            links: userPosts[i].links,
            author: userPosts[i].author,
            userType: userPosts[i].userType,
            isVerified: userPosts[i].isVerified,
            likes: userPosts[i].votes.length,
            comments: userPosts[i].comments.length,
            liked: userId ? userPosts[i].votes.length > 0 : false,
            createdAt: userPosts[i].createdAt,
          },
        });
      }

      if (i < newsArticles.length) {
        mixedFeed.push({
          type: 'news',
          data: newsArticles[i],
        });
      }
    }

    res.status(200).json({
      success: true,
      data: mixedFeed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get mixed feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mixed feed',
      error: error.message,
    });
  }
};

module.exports = {
  getNewsByCategory,
  searchNews,
  getTrendingNews,
  getMixedFeed,
};
