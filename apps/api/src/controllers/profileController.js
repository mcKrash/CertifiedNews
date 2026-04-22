const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get user profile
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { followerId: true },
            }
          : false,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isFollowing = currentUserId
      ? user.followers && user.followers.length > 0
      : false;

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        userType: user.userType,
        isVerified: user.isVerified,
        location: user.location,
        website: user.website,
        joinedDate: user.createdAt,
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing,
        isCurrentUser: currentUserId === userId,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, location, website, avatarUrl, coverUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(location && { location }),
        ...(website && { website }),
        ...(avatarUrl && { avatarUrl }),
        ...(coverUrl && { coverUrl }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl,
        coverUrl: updatedUser.coverUrl,
        location: updatedUser.location,
        website: updatedUser.website,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * Follow user
 */
const followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params;

    if (followerId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: userId,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Unfollowed successfully',
        following: false,
      });
    }

    // Follow
    await prisma.follow.create({
      data: {
        followerId,
        followingId: userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Followed successfully',
      following: true,
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow user',
      error: error.message,
    });
  }
};

/**
 * Get user followers
 */
const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: parseInt(limit),
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            userType: true,
            isVerified: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.follow.count({
      where: { followingId: userId },
    });

    res.status(200).json({
      success: true,
      data: followers.map(f => f.follower),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followers',
      error: error.message,
    });
  }
};

/**
 * Get user following
 */
const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: parseInt(limit),
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            userType: true,
            isVerified: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.follow.count({
      where: { followerId: userId },
    });

    res.status(200).json({
      success: true,
      data: following.map(f => f.following),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch following',
      error: error.message,
    });
  }
};

/**
 * Get user activity feed
 */
const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
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
      where: { authorId: userId },
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      images: post.images,
      links: post.links,
      author: post.author,
      likes: post.votes.length,
      comments: post.comments.length,
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
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message,
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  followUser,
  getUserFollowers,
  getUserFollowing,
  getUserActivity,
};
