const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create a comment or reply
 */
const createComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!postId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and content are required',
      });
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // If replying to a comment, verify parent comment exists
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
      });

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentCommentId: parentCommentId || null,
      },
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
        likes: true,
        replies: {
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
            likes: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        id: comment.id,
        content: comment.content,
        author: comment.author,
        likes: comment.likes.length,
        replies: comment.replies.length,
        createdAt: comment.createdAt,
      },
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
 * Get comments for a post
 */
const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null, // Only get top-level comments
      },
      skip,
      take: parseInt(limit),
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
        likes: true,
        replies: {
          orderBy: { createdAt: 'asc' },
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
            likes: true,
          },
        },
      },
    });

    const total = await prisma.comment.count({
      where: { postId, parentCommentId: null },
    });

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: comment.author,
      likes: comment.likes.length,
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        author: reply.author,
        likes: reply.likes.length,
        createdAt: reply.createdAt,
      })),
      createdAt: comment.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
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
 * Like a comment
 */
const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if already liked
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      // Remove like
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Like removed',
        liked: false,
      });
    }

    // Add like
    await prisma.commentLike.create({
      data: {
        userId,
        commentId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Comment liked',
      liked: true,
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like comment',
      error: error.message,
    });
  }
};

/**
 * Update a comment
 */
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    // Verify comment exists and user is author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment',
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
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
        likes: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        id: updatedComment.id,
        content: updatedComment.content,
        author: updatedComment.author,
        likes: updatedComment.likes.length,
        createdAt: updatedComment.createdAt,
      },
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message,
    });
  }
};

/**
 * Delete a comment
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Verify comment exists and user is author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    // Delete comment and its replies
    await prisma.comment.deleteMany({
      where: {
        OR: [{ id: commentId }, { parentCommentId: commentId }],
      },
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
  getPostComments,
  likeComment,
  updateComment,
  deleteComment,
};
