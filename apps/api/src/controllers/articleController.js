const { articles, verificationLog, hydrateArticle } = require('../data/mockData');

// Lazy initialize Prisma to avoid startup errors when using mock data
let prisma;
function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

// Helper to determine if we should use mock data
function useMockData() {
  return !process.env.DATABASE_URL;
}

// Get all articles with pagination and filters
exports.getAllArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    if (useMockData()) {
      let data = articles.map(hydrateArticle);
      if (category) {
        data = data.filter(a => a.category.slug === category);
      }
      if (search) {
        const term = search.toLowerCase();
        data = data.filter(a => a.title.toLowerCase().includes(term) || a.body.toLowerCase().includes(term));
      }
      const paginated = data.slice(skip, skip + limitNumber);
      return res.status(200).json({
        success: true,
        data: paginated,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: data.length,
          pages: Math.ceil(data.length / limitNumber),
        },
      });
    }

    // Build where clause for filters
    const where = {};
    if (category) {
      where.category = { slug: category };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Query database
    const dbArticles = await getPrisma().article.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });

    // Get total count for pagination
    const total = await getPrisma().article.count({ where });

    res.status(200).json({
      success: true,
      data: dbArticles,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single article by ID
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const articleId = parseInt(id);

    if (useMockData()) {
      const article = articles.find(a => a.id === articleId);
      if (!article) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }
      return res.status(200).json({ success: true, data: hydrateArticle(article) });
    }

    const article = await getPrisma().article.findUnique({
      where: { id: articleId },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        verificationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
      });
    }

    // Increment view count
    await getPrisma().article.update({
      where: { id: articleId },
      data: { viewCount: { increment: 1 } },
    });

    res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create new article (admin only)
exports.createArticle = async (req, res) => {
  try {
    const { title, body, categoryId, sourceUrl, sourceName, authorId, publishedAt } = req.body;

    // Validate required fields
    if (!title || !body || !categoryId || !sourceUrl || !sourceName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, body, categoryId, sourceUrl, sourceName',
      });
    }

    if (useMockData()) {
      const newArticle = {
        id: articles.length + 101,
        title,
        body,
        categoryId: parseInt(categoryId),
        sourceUrl,
        sourceName,
        authorId: parseInt(authorId) || 1,
        publishedAt: publishedAt || new Date().toISOString(),
        status: 'pending',
        imageUrl: null,
        viewCount: 0,
      };
      articles.push(newArticle);
      return res.status(201).json({ success: true, data: hydrateArticle(newArticle) });
    }

    // Create article
    const newArticle = await getPrisma().article.create({
      data: {
        title,
        body,
        categoryId: parseInt(categoryId),
        sourceUrl,
        sourceName,
        authorId: parseInt(authorId) || 1, // Default to admin user
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        status: 'pending',
      },
      include: {
        author: { select: { id: true, username: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Log verification event
    await getPrisma().verificationLog.create({
      data: {
        articleId: newArticle.id,
        contentType: 'article',
        checkedBy: 'system',
        result: 'pending',
        notes: 'New article submitted, awaiting verification',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Article created successfully and pending verification',
      data: newArticle,
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update article status (moderator action)
exports.updateArticleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const articleId = parseInt(id);

    // Validate status
    const validStatuses = ['verified', 'rejected', 'pending', 'unverified'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    if (useMockData()) {
      const article = articles.find(a => a.id === articleId);
      if (!article) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }
      article.status = status;
      return res.status(200).json({ success: true, data: hydrateArticle(article) });
    }

    // Update article
    const updatedArticle = await getPrisma().article.update({
      where: { id: articleId },
      data: { status },
      include: {
        author: { select: { id: true, username: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Log verification action
    await getPrisma().verificationLog.create({
      data: {
        articleId: articleId,
        contentType: 'article',
        checkedBy: 'moderator', // TODO: Get from authenticated user
        result: status,
        notes: notes || `Article status changed to ${status}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Article status updated to ${status}`,
      data: updatedArticle,
    });
  } catch (error) {
    console.error('Error updating article status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete article (admin only)
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const articleId = parseInt(id);

    if (useMockData()) {
      const index = articles.findIndex(a => a.id === articleId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }
      articles.splice(index, 1);
      return res.status(200).json({ success: true, message: `Article ${id} deleted successfully` });
    }

    await getPrisma().article.delete({
      where: { id: articleId },
    });

    res.status(200).json({
      success: true,
      message: `Article ${id} deleted successfully`,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
      });
    }
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
