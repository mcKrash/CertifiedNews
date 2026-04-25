const { checkContentViolation, recordViolation, isUserBanned } = require('../utils/moderation');
const prisma = require('../prisma');

const serializeComment = (comment) => ({
  id: comment.id,
  content: comment.content,
  userId: comment.user.id,
  userName: comment.user.name,
  username: comment.user.username,
  userAvatar: comment.user.avatarUrl || comment.user.profilePhotoUrl || null,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  likes: comment.likeCount || 0,
  replies: (comment.replies || []).map((reply) => serializeComment(reply)),
});

const createComment = async (req, res) => {
  try {
    let { content, articleId, postId, parentId } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ success: false, message: 'Comment exceeds maximum length of 2000 characters' });
    }

    if (!articleId && !postId) {
      return res.status(400).json({ success: false, message: 'Either articleId or postId is required' });
    }

    // Convert to string to avoid Prisma validation errors
    if (articleId) articleId = String(articleId);
    if (postId) postId = String(postId);

    const banStatus = isUserBanned(userId);
    if (banStatus.isBanned) {
      return res.status(403).json({ success: false, message: banStatus.reason });
    }

    const violation = checkContentViolation(content);
    if (violation.isViolating) {
      recordViolation(userId, violation.severity);
      return res.status(400).json({
        success: false,
        message: violation.reason || 'Your comment violates our Community Guidelines',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        articleId: articleId || null,
        postId: postId || null,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: serializeComment({ ...comment, replies: [], likeCount: 0 }),
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create comment', error: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    let { articleId, postId, page = 1, limit = 10 } = req.query;

    if (!articleId && !postId) {
      return res.status(400).json({ success: false, message: 'Either articleId or postId is required' });
    }

    // Convert to string to avoid Prisma validation errors
    if (articleId) articleId = String(articleId);
    if (postId) postId = String(postId);

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const where = {
      articleId: articleId || null,
      postId: postId || null,
      parentId: null,
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              profilePhotoUrl: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatarUrl: true,
                  profilePhotoUrl: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      avatarUrl: true,
                      profilePhotoUrl: true,
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.comment.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: comments.map((comment) => serializeComment(comment)),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments', error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this comment' });
    }

    await prisma.comment.delete({ where: { id } });

    return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete comment', error: error.message });
  }
};

module.exports = {
  createComment,
  getComments,
  deleteComment,
};
