const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create a new post
 */
const createPost = async (req, res) => {
  try {
    const { content, images = [], links = [] } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required',
      });
    }

    // Get user data including verification status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        journalistProfile: true,
        agencyProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        content,
        images: images || [],
        links: links || [],
        authorId: userId,
        userType: user.userType,
        isVerified: user.isVerified,
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
        votes: true,
        comments: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        id: post.id,
        content: post.content,
        images: post.images,
        links: post.links,
        author: post.author,
        userType: post.userType,
        isVerified: post.isVerified,
        likes: post.votes.length,
        comments: post.comments.length,
        liked: false,
        createdAt: post.createdAt,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message,
    });
  }
};

/**
 * Get all posts with pagination
 */
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await prisma.post.findMany({
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
        votes: userId ? { where: { userId } } : false,
        comments: {
          take: 2,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.post.count();

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      images: post.images,
      links: post.links,
      author: post.author,
      userType: post.userType,
      isVerified: post.isVerified,
      likes: post.votes.length,
      comments: post.comments.length,
      liked: userId ? post.votes.length > 0 : false,
      createdAt: post.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message,
    });
  }
};

/**
 * Get posts by user
 */
const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
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
        votes: true,
        comments: true,
      },
    });

    const total = await prisma.post.count({
      where: { authorId: user.id },
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      images: post.images,
      links: post.links,
      author: post.author,
      userType: post.userType,
      isVerified: post.isVerified,
      likes: post.votes.length,
      comments: post.comments.length,
      liked: false,
      createdAt: post.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts',
      error: error.message,
    });
  }
};

/**
 * Get single post
 */
const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: post.id,
        content: post.content,
        images: post.images,
        links: post.links,
        author: post.author,
        userType: post.userType,
        isVerified: post.isVerified,
        likes: post.votes.length,
        comments: post.comments,
        createdAt: post.createdAt,
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: error.message,
    });
  }
};

/**
 * Update post
 */
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, images = [], links = [] } = req.body;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this post',
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content,
        images,
        links,
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
        votes: true,
        comments: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: {
        id: updatedPost.id,
        content: updatedPost.content,
        images: updatedPost.images,
        links: updatedPost.links,
        author: updatedPost.author,
        userType: updatedPost.userType,
        isVerified: updatedPost.isVerified,
        likes: updatedPost.votes.length,
        comments: updatedPost.comments.length,
        createdAt: updatedPost.createdAt,
      },
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post',
      error: error.message,
    });
  }
};

/**
 * Delete post
 */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this post',
      });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  getUserPosts,
  getPost,
  updatePost,
  deletePost,
};
