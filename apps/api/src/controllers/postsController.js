const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const formatPost = (post, currentUserId = null) => ({
  id: post.id,
  title: post.title || null,
  content: post.content,
  images: post.imageUrl ? [post.imageUrl] : [],
  links: post.sourceUrl ? [post.sourceUrl] : [],
  sourceUrl: post.sourceUrl || null,
  imageUrl: post.imageUrl || null,
  status: post.status,
  likes: post._count?.votes ?? post.likes ?? 0,
  comments: post._count?.comments ?? 0,
  liked: currentUserId ? post.votes?.some((vote) => vote.userId === currentUserId) : false,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  author: {
    id: post.user.id,
    name: post.user.name,
    username: post.user.username,
    avatarUrl: post.user.avatarUrl || post.user.profilePhotoUrl || null,
    userType: post.user.userType,
    isVerified: post.user.isVerified,
  },
});

const createPost = async (req, res) => {
  try {
    const { content, title, imageUrl, sourceUrl } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const post = await prisma.post.create({
      data: {
        title: title || null,
        content: content.trim(),
        imageUrl: imageUrl || null,
        sourceUrl: sourceUrl || null,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            profilePhotoUrl: true,
            userType: true,
            isVerified: true,
          },
        },
        votes: true,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: formatPost(post, userId),
    });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              profilePhotoUrl: true,
              userType: true,
              isVerified: true,
            },
          },
          votes: userId ? { where: { userId } } : false,
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.post.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: posts.map((post) => formatPost(post, userId || null)),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch posts', error: error.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, userId } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { userId: user.id },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              profilePhotoUrl: true,
              userType: true,
              isVerified: true,
            },
          },
          votes: userId ? { where: { userId } } : false,
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.post.count({ where: { userId: user.id } }),
    ]);

    return res.status(200).json({
      success: true,
      data: posts.map((post) => formatPost(post, userId || null)),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user posts', error: error.message });
  }
};

const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id || null;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            profilePhotoUrl: true,
            userType: true,
            isVerified: true,
          },
        },
        votes: currentUserId ? { where: { userId: currentUserId } } : false,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(200).json({
      success: true,
      data: formatPost(post, currentUserId),
    });
  } catch (error) {
    console.error('Get post error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch post', error: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title, imageUrl, sourceUrl } = req.body;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this post' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(typeof title === 'string' ? { title } : {}),
        ...(typeof content === 'string' ? { content: content.trim() } : {}),
        ...(typeof imageUrl !== 'undefined' ? { imageUrl: imageUrl || null } : {}),
        ...(typeof sourceUrl !== 'undefined' ? { sourceUrl: sourceUrl || null } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            profilePhotoUrl: true,
            userType: true,
            isVerified: true,
          },
        },
        votes: { where: { userId } },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: formatPost(updatedPost, userId),
    });
  } catch (error) {
    console.error('Update post error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update post', error: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
    }

    await prisma.post.delete({ where: { id } });

    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
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
