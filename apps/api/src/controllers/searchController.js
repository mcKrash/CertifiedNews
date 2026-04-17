const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Search articles, categories, and sources
 */
const search = async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const skip = (page - 1) * limit;
    const searchTerm = q.toLowerCase();

    let results = {
      articles: [],
      categories: [],
      sources: [],
    };

    // Search articles
    if (type === 'all' || type === 'articles') {
      const [articles, articleCount] = await Promise.all([
        prisma.article.findMany({
          where: {
            status: 'VERIFIED',
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { body: { contains: searchTerm, mode: 'insensitive' } },
              { excerpt: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          include: {
            source: true,
            category: true,
            _count: {
              select: { votes: true, comments: true },
            },
          },
          orderBy: { publishedAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.article.count({
          where: {
            status: 'VERIFIED',
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { body: { contains: searchTerm, mode: 'insensitive' } },
              { excerpt: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        }),
      ]);

      results.articles = {
        data: articles.map(article => ({
          ...article,
          likeCount: article._count.votes,
          commentCount: article._count.comments,
        })),
        total: articleCount,
        pages: Math.ceil(articleCount / limit),
      };
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      results.categories = categories;
    }

    // Search sources
    if (type === 'all' || type === 'sources') {
      const sources = await prisma.source.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      results.sources = sources;
    }

    res.status(200).json({
      success: true,
      data: results,
      query: q,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
};

/**
 * Get trending search terms
 */
const getTrendingSearches = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get articles with most engagement in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trendingArticles = await prisma.article.findMany({
      where: {
        status: 'VERIFIED',
        publishedAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        _count: {
          select: { votes: true, comments: true },
        },
      },
      orderBy: [
        { votes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
      ],
      take: parseInt(limit),
    });

    const trending = trendingArticles.map(article => ({
      id: article.id,
      title: article.title,
      engagementScore: article._count.votes + article._count.comments,
      likeCount: article._count.votes,
      commentCount: article._count.comments,
    }));

    res.status(200).json({
      success: true,
      data: trending,
    });
  } catch (error) {
    console.error('Get trending searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending searches',
      error: error.message,
    });
  }
};

module.exports = {
  search,
  getTrendingSearches,
};
