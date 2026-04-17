const mockData = require('../data/mockData');

// Get all users (admin only)
exports.getAllUsers = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockData.users,
      count: mockData.users.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user by ID
exports.getUserById = (req, res) => {
  try {
    const { userId } = req.params;
    const user = mockData.users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user profile with contribution history
exports.getUserProfile = (req, res) => {
  try {
    const { username } = req.params;
    const user = mockData.users.find(u => u.username === username);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get user's posts
    const userPosts = mockData.communityPosts.filter(p => p.userId === user.id);
    
    // Get user's comments
    const userComments = mockData.comments.filter(c => c.userId === user.id);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        posts: userPosts,
        comments: userComments,
        contributionCount: userPosts.length + userComments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update user profile
exports.updateUserProfile = (req, res) => {
  try {
    const { userId } = req.params;
    const { username, avatarUrl } = req.body;

    const user = mockData.users.find(u => u.id === parseInt(userId));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (username) user.username = username;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user trust score
exports.getUserTrustScore = (req, res) => {
  try {
    const { userId } = req.params;
    const user = mockData.users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        trustScore: user.trustScore,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update trust score (admin only)
exports.updateTrustScore = (req, res) => {
  try {
    const { userId } = req.params;
    const { points, reason } = req.body;

    const user = mockData.users.find(u => u.id === parseInt(userId));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const oldScore = user.trustScore;
    user.trustScore = Math.max(0, Math.min(1000, user.trustScore + points));

    res.status(200).json({
      success: true,
      message: 'Trust score updated',
      data: {
        userId: user.id,
        username: user.username,
        oldScore,
        newScore: user.trustScore,
        pointsChanged: points,
        reason,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Ban/unban user (admin only)
exports.toggleUserBan = (req, res) => {
  try {
    const { userId } = req.params;
    const user = mockData.users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isBanned = !user.isBanned;

    res.status(200).json({
      success: true,
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Promote user to verified reporter (admin only)
exports.promoteToVerifiedReporter = (req, res) => {
  try {
    const { userId } = req.params;
    const user = mockData.users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'verified_reporter') {
      return res.status(400).json({ success: false, error: 'User is already a verified reporter' });
    }

    user.role = 'verified_reporter';
    user.trustScore = Math.min(1000, user.trustScore + 100);

    res.status(200).json({
      success: true,
      message: 'User promoted to Verified Reporter',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user activity log
exports.getUserActivityLog = (req, res) => {
  try {
    const { userId } = req.params;
    const user = mockData.users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userPosts = mockData.communityPosts.filter(p => p.userId === user.id);
    const userComments = mockData.comments.filter(c => c.userId === user.id);
    const userVotes = mockData.votes.filter(v => v.userId === user.id);

    const activity = [
      ...userPosts.map(p => ({ type: 'post', timestamp: p.createdAt, data: p })),
      ...userComments.map(c => ({ type: 'comment', timestamp: c.createdAt, data: c })),
      ...userVotes.map(v => ({ type: 'vote', timestamp: v.createdAt, data: v })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        activity,
        activityCount: activity.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
