const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Add bookmark
 */
const addBookmark = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required',
      });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Bookmark removed',
        bookmarked: false,
      });
    }

    // Add bookmark
    await prisma.bookmark.create({
      data: {
        userId,
        postId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Post bookmarked',
      bookmarked: true,
    });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bookmark post',
      error: error.message,
    });
  }
};

/**
 * Get user bookmarks
 */
const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
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
            votes: true,
            comments: true,
          },
        },
      },
    });

    const total = await prisma.bookmark.count({
      where: { userId },
    });

    const formattedBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.post.id,
      content: bookmark.post.content,
      images: bookmark.post.images,
      links: bookmark.post.links,
      author: bookmark.post.author,
      userType: bookmark.post.userType,
      isVerified: bookmark.post.isVerified,
      likes: bookmark.post.votes.length,
      comments: bookmark.post.comments.length,
      liked: false,
      bookmarked: true,
      createdAt: bookmark.post.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedBookmarks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
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

module.exports = {
  addBookmark,
  getUserBookmarks,
};
