const { PrismaClient } = require('@prisma/client');
const { checkContentViolation, recordViolation, banUser } = require('../utils/moderation');

const prisma = new PrismaClient();

/**
 * Review pending articles
 */
const getPendingArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          status: { in: ['PENDING', 'UNDER_REVIEW'] },
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          source: true,
          category: true,
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.article.count({
        where: {
          status: { in: ['PENDING', 'UNDER_REVIEW'] },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get pending articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending articles',
      error: error.message,
    });
  }
};

/**
 * Review article and approve/reject
 */
const reviewArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { status, notes } = req.body;
    const moderatorId = req.user.id;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be VERIFIED or REJECTED',
      });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: {
        status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
      include: {
        author: true,
        source: true,
      },
    });

    // Create notification for author
    if (article.authorId) {
      await prisma.notification.create({
        data: {
          userId: article.authorId,
          type: status === 'VERIFIED' ? 'ARTICLE_VERIFIED' : 'SYSTEM_ALERT',
          title: status === 'VERIFIED' ? 'Article Verified' : 'Article Rejected',
          message: notes || `Your article has been ${status.toLowerCase()}`,
          relatedId: articleId,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Article ${status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error('Review article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review article',
      error: error.message,
    });
  }
};

/**
 * Review pending comments
 */
const getPendingComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          status: { in: ['PENDING', 'REJECTED'] },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          article: {
            select: { id: true, title: true },
          },
          post: {
            select: { id: true, content: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.comment.count({
        where: {
          status: { in: ['PENDING', 'REJECTED'] },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get pending comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending comments',
      error: error.message,
    });
  }
};

/**
 * Moderate comment
 */
const moderateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { status, action, banDuration, reason } = req.body;
    const moderatorId = req.user.id;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be APPROVED or REJECTED',
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check for violations
    const violation = checkContentViolation(comment.content);
    if (violation.isViolating) {
      recordViolation(comment.userId, violation.severity);
    }

    // Update comment status
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { status },
      include: { user: true },
    });

    // Apply user action if needed
    if (action === 'ban' && banDuration) {
      banUser(comment.userId, banDuration, reason);

      // Create notification
      await prisma.notification.create({
        data: {
          userId: comment.userId,
          type: 'SYSTEM_ALERT',
          title: 'Account Suspended',
          message: `Your account has been suspended for ${banDuration} days. Reason: ${reason}`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Comment ${status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate comment',
      error: error.message,
    });
  }
};

/**
 * Get moderation statistics
 */
const getModerationStats = async (req, res) => {
  try {
    const [pendingArticles, pendingComments, rejectedArticles, rejectedComments] =
      await Promise.all([
        prisma.article.count({
          where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
        }),
        prisma.comment.count({
          where: { status: 'PENDING' },
        }),
        prisma.article.count({
          where: { status: 'REJECTED' },
        }),
        prisma.comment.count({
          where: { status: 'REJECTED' },
        }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        pendingArticles,
        pendingComments,
        rejectedArticles,
        rejectedComments,
        totalPending: pendingArticles + pendingComments,
      },
    });
  } catch (error) {
    console.error('Get moderation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderation statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getPendingArticles,
  reviewArticle,
  getPendingComments,
  moderateComment,
  getModerationStats,
};
