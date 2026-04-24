const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const serializeUserProfile = (user, currentUserId) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  bio: user.bio || null,
  avatarUrl: user.avatarUrl || user.profilePhotoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`,
  coverUrl: null,
  userType: user.userType,
  role: user.role,
  isVerified: user.isVerified,
  emailVerified: user.emailVerified,
  joinedDate: user.createdAt,
  postsCount: user._count.posts,
  followersCount: user._count.followers,
  followingCount: user._count.following,
  isFollowing: Boolean(user.followers?.length),
  isCurrentUser: currentUserId === user.id,
  topicsOfInterest: user.preferences?.topicsOfInterest || [],
  preferredLanguage: user.preferences?.preferredLanguage || 'en',
  journalistProfile: user.journalistProfile || null,
  agencyProfile: user.agencyProfile || null,
});

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { username: userId }],
      },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: {
          include: { socialHandles: true },
        },
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

    return res.status(200).json({
      success: true,
      data: serializeUserProfile(user, currentUserId),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, avatarUrl, preferredLanguage, topicsOfInterest } = req.body;

    await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...(preferredLanguage ? { preferredLanguage } : {}),
        ...(Array.isArray(topicsOfInterest) ? { topicsOfInterest } : {}),
      },
      create: {
        userId,
        preferredLanguage: preferredLanguage || 'en',
        topicsOfInterest: Array.isArray(topicsOfInterest) ? topicsOfInterest : [],
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name } : {}),
        ...(typeof bio === 'string' ? { bio } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: {
          include: { socialHandles: true },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
        followers: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: serializeUserProfile(updatedUser, userId),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

const followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params;

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { username: userId }],
      },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (followerId === targetUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself',
      });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Unfollowed successfully',
        following: false,
      });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId: targetUser.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Followed successfully',
      following: true,
    });
  } catch (error) {
    console.error('Follow user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to follow user',
      error: error.message,
    });
  }
};

const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { username: userId }],
      },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      skip,
      take: parseInt(limit, 10),
      include: {
        follower: {
          include: {
            preferences: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.follow.count({ where: { followingId: user.id } });

    return res.status(200).json({
      success: true,
      data: followers.map((entry) => ({
        id: entry.follower.id,
        name: entry.follower.name,
        username: entry.follower.username,
        avatarUrl: entry.follower.avatarUrl || entry.follower.profilePhotoUrl || null,
        userType: entry.follower.userType,
        isVerified: entry.follower.isVerified,
        topicsOfInterest: entry.follower.preferences?.topicsOfInterest || [],
        bio: entry.follower.bio || null,
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch followers', error: error.message });
  }
};

const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { username: userId }],
      },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      skip,
      take: parseInt(limit, 10),
      include: {
        following: {
          include: {
            preferences: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.follow.count({ where: { followerId: user.id } });

    return res.status(200).json({
      success: true,
      data: following.map((entry) => ({
        id: entry.following.id,
        name: entry.following.name,
        username: entry.following.username,
        avatarUrl: entry.following.avatarUrl || entry.following.profilePhotoUrl || null,
        userType: entry.following.userType,
        isVerified: entry.following.isVerified,
        topicsOfInterest: entry.following.preferences?.topicsOfInterest || [],
        bio: entry.following.bio || null,
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Get following error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch following', error: error.message });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { username: userId }],
      },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      skip,
      take: parseInt(limit, 10),
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
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    const total = await prisma.post.count({ where: { userId: user.id } });

    return res.status(200).json({
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        content: post.content,
        images: post.imageUrl ? [post.imageUrl] : [],
        links: post.sourceUrl ? [post.sourceUrl] : [],
        author: {
          id: post.user.id,
          name: post.user.name,
          username: post.user.username,
          avatarUrl: post.user.avatarUrl || post.user.profilePhotoUrl || null,
          userType: post.user.userType,
          isVerified: post.user.isVerified,
        },
        likes: post._count.votes,
        comments: post._count.comments,
        createdAt: post.createdAt,
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user activity', error: error.message });
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
