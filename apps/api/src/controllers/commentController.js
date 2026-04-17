const { PrismaClient } = require('@prisma/client');
const { checkContentViolation, recordViolation, isUserBanned } = require('../utils/moderation');

const prisma = new PrismaClient();

/**
 * Create a new comment
 */
const createComment = async (req, res) => {
  try {
    const { content, articleId, postId, parentId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty',
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment exceeds maximum length of 2000 characters',
      });
    }

    if (!articleId && !postId) {
      return res.status(400).json({
        success: false,
        message: 'Either articleId or postId is required',
      });
    }

    // Check if user is banned
    const banStatus = isUserBanned(userId);
    if (banStatus.isBanned) {
      return res.status(403).json({
        success: false,
        message: banStatus.reason,
      });
    }

    // Check content violation
    const violation = checkContentViolation(content);
    if (violation.isViolating) {
      recordViolation(userId, violation.severity);
      return res.status(400).json({
        success: false,
        message: violation.reason || 'Your comment violates our Community Guidelines',
      });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        articleId: articleId || null,
        postId: postId || null,
        parentId: parentId || null,
        status: 'APPROVED',
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message,
    });
  }
};

/**
 * Get comments for article or post
 */
const getComments = async (req, res) => {
  try {
    const { articleId, postId, page = 1, limit = 10 } = req.query;

    if (!articleId && !postId) {
      return res.status(400).json({
        success: false,
        message: 'Either articleId or postId is required',
      });
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          articleId: articleId || null,
          postId: postId || null,
          parentId: null, // Only top-level comments
          status: 'APPROVED',
        },
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
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { votes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.comment.count({
        where: {
          articleId: articleId || null,
          postId: postId || null,
          parentId: null,
          status: 'APPROVED',
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: comments.map(comment => ({
        ...comment,
        likeCount: comment._count.votes,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message,
    });
  }
};

/**
 * Delete comment (own or admin)
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check authorization
    if (comment.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment',
      });
    }

    await prisma.comment.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message,
    });
  }
};

module.exports = {
  createComment,
  getComments,
  deleteComment,
};
