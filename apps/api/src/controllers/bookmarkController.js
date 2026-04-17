const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Add or remove bookmark
 */
const toggleBookmark = async (req, res) => {
  try {
    const { articleId } = req.body;
    const userId = req.user.id;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        message: 'articleId is required',
      });
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    let bookmark;
    if (existingBookmark) {
      // Remove bookmark if it exists
      await prisma.bookmark.delete({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });
      bookmark = null;
    } else {
      // Create new bookmark
      bookmark = await prisma.bookmark.create({
        data: {
          userId,
          articleId,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: existingBookmark ? 'Bookmark removed' : 'Bookmark added',
      data: {
        bookmarked: !existingBookmark,
      },
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark',
      error: error.message,
    });
  }
};

/**
 * Get user's bookmarks
 */
const getUserBookmarks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          article: {
            include: {
              source: true,
              category: true,
              _count: {
                select: { votes: true, comments: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    res.status(200).json({
      success: true,
      data: bookmarks.map(b => ({
        ...b.article,
        likeCount: b.article._count.votes,
        commentCount: b.article._count.comments,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarks',
      error: error.message,
    });
  }
};

/**
 * Check if article is bookmarked
 */
const isBookmarked = async (req, res) => {
  try {
    const { articleId } = req.query;
    const userId = req.user.id;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        message: 'articleId is required',
      });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        bookmarked: !!bookmark,
      },
    });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check bookmark status',
      error: error.message,
    });
  }
};

module.exports = {
  toggleBookmark,
  getUserBookmarks,
  isBookmarked,
};
