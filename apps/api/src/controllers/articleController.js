const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get all articles with filtering and pagination
 */
const getArticles = async (req, res) => {
  try {
    const { categoryId, sourceId, page = 1, limit = 10, search } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      status: 'VERIFIED',
    };

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (sourceId) {
      where.sourceId = sourceId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          source: true,
          category: true,
          _count: {
            select: { votes: true, comments: true, bookmarks: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.article.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: articles.map(article => ({
        ...article,
        likeCount: article._count.votes,
        commentCount: article._count.comments,
        bookmarkCount: article._count.bookmarks,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      error: error.message,
    });
  }
};

/**
 * Get single article by ID (increments view count)
 */
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Increment view count
    await prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        source: true,
        category: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { votes: true, bookmarks: true },
        },
      },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...article,
        likeCount: article._count.votes,
        bookmarkCount: article._count.bookmarks,
      },
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: error.message,
    });
  }
};

/**
 * Get trending articles
 */
const getTrendingArticles = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const articles = await prisma.article.findMany({
      where: { status: 'VERIFIED' },
      include: {
        source: true,
        category: true,
        _count: {
          select: { votes: true, comments: true },
        },
      },
      orderBy: [
        { votes: { _count: 'desc' } },
        { publishedAt: 'desc' },
      ],
      take: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: articles.map(article => ({
        ...article,
        likeCount: article._count.votes,
        commentCount: article._count.comments,
      })),
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending articles',
      error: error.message,
    });
  }
};

/**
 * Create article (for reporters)
 */
const createArticle = async (req, res) => {
  try {
    const { title, body, excerpt, imageUrl, sourceId, categoryId } = req.body;

    const article = await prisma.article.create({
      data: {
        title,
        body,
        excerpt: excerpt || body.substring(0, 150),
        imageUrl,
        sourceId,
        categoryId,
        authorId: req.user.id,
        status: 'UNDER_REVIEW',
      },
      include: {
        source: true,
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article,
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create article',
      error: error.message,
    });
  }
};

module.exports = {
  getArticles,
  getArticleById,
  getTrendingArticles,
  createArticle,
};
