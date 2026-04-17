const mockData = require('../data/mockData');

// Get verification status for a post
exports.getVerificationStatus = (req, res) => {
  try {
    const { contentId, contentType } = req.params;

    let content;
    if (contentType === 'article') {
      content = mockData.articles.find(a => a.id === parseInt(contentId));
    } else if (contentType === 'post') {
      content = mockData.communityPosts.find(p => p.id === parseInt(contentId));
    }

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    const verificationLog = mockData.verificationLog.filter(
      v => v.contentId === parseInt(contentId) && v.contentType === contentType
    );

    res.status(200).json({
      success: true,
      data: {
        contentId,
        contentType,
        status: content.status,
        verificationHistory: verificationLog.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get audit trail for content
exports.getAuditTrail = (req, res) => {
  try {
    const { contentId, contentType } = req.params;

    const auditTrail = mockData.verificationLog.filter(
      v => v.contentId === parseInt(contentId) && v.contentType === contentType
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (auditTrail.length === 0) {
      return res.status(404).json({ success: false, error: 'No audit trail found' });
    }

    res.status(200).json({
      success: true,
      data: {
        contentId,
        contentType,
        auditTrail,
        totalEvents: auditTrail.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify content (admin/moderator)
exports.verifyContent = (req, res) => {
  try {
    const { contentId, contentType } = req.params;
    const { status, notes, checkedBy } = req.body;

    let content;
    if (contentType === 'article') {
      content = mockData.articles.find(a => a.id === parseInt(contentId));
    } else if (contentType === 'post') {
      content = mockData.communityPosts.find(p => p.id === parseInt(contentId));
    }

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    const oldStatus = content.status;
    content.status = status; // 'verified', 'unverified', 'under review', 'rejected'

    // Log verification action
    const logEntry = {
      id: mockData.verificationLog.length + 1,
      contentId: parseInt(contentId),
      contentType,
      checkedBy: checkedBy || 'system',
      result: status,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    mockData.verificationLog.push(logEntry);

    res.status(200).json({
      success: true,
      message: 'Content verification status updated',
      data: {
        contentId,
        contentType,
        oldStatus,
        newStatus: status,
        logEntry,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get moderation queue
exports.getModerationQueue = (req, res) => {
  try {
    const { status = 'under review', limit = 20, offset = 0 } = req.query;

    // Get posts with matching status
    let queue = mockData.communityPosts.filter(p => p.status === status);

    // Add user info
    queue = queue.map(post => {
      const user = mockData.users.find(u => u.id === post.userId);
      return {
        ...post,
        user: {
          id: user.id,
          username: user.username,
          trustScore: user.trustScore,
          role: user.role,
        },
      };
    });

    // Sort by creation date (newest first)
    queue = queue.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Paginate
    const paginatedQueue = queue.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedQueue,
      pagination: {
        total: queue.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < queue.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve content
exports.approveContent = (req, res) => {
  try {
    const { contentId, contentType } = req.params;
    const { notes, moderatorId } = req.body;

    let content;
    if (contentType === 'article') {
      content = mockData.articles.find(a => a.id === parseInt(contentId));
    } else if (contentType === 'post') {
      content = mockData.communityPosts.find(p => p.id === parseInt(contentId));
    }

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    content.status = 'verified';

    // Log action
    mockData.verificationLog.push({
      id: mockData.verificationLog.length + 1,
      contentId: parseInt(contentId),
      contentType,
      checkedBy: moderatorId || 'moderator',
      result: 'approved',
      notes: notes || 'Approved by moderator',
      createdAt: new Date().toISOString(),
    });

    // Award trust points to poster if it's a community post
    if (contentType === 'post') {
      const user = mockData.users.find(u => u.id === content.userId);
      if (user) {
        user.trustScore = Math.min(1000, user.trustScore + 20);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Content approved',
      data: content,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject content
exports.rejectContent = (req, res) => {
  try {
    const { contentId, contentType } = req.params;
    const { reason, notes, moderatorId } = req.body;

    let content;
    if (contentType === 'article') {
      content = mockData.articles.find(a => a.id === parseInt(contentId));
    } else if (contentType === 'post') {
      content = mockData.communityPosts.find(p => p.id === parseInt(contentId));
    }

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    content.status = 'rejected';

    // Log action
    mockData.verificationLog.push({
      id: mockData.verificationLog.length + 1,
      contentId: parseInt(contentId),
      contentType,
      checkedBy: moderatorId || 'moderator',
      result: 'rejected',
      notes: `${reason}: ${notes || ''}`,
      createdAt: new Date().toISOString(),
    });

    // Penalize trust points if it's a community post
    if (contentType === 'post') {
      const user = mockData.users.find(u => u.id === content.userId);
      if (user) {
        user.trustScore = Math.max(0, user.trustScore - 50);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Content rejected',
      data: content,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Request edit on content
exports.requestEdit = (req, res) => {
  try {
    const { contentId, contentType } = req.params;
    const { editRequest, moderatorId } = req.body;

    let content;
    if (contentType === 'article') {
      content = mockData.articles.find(a => a.id === parseInt(contentId));
    } else if (contentType === 'post') {
      content = mockData.communityPosts.find(p => p.id === parseInt(contentId));
    }

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    content.status = 'under review';

    // Log action
    mockData.verificationLog.push({
      id: mockData.verificationLog.length + 1,
      contentId: parseInt(contentId),
      contentType,
      checkedBy: moderatorId || 'moderator',
      result: 'edit_requested',
      notes: `Edit requested: ${editRequest}`,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Edit requested from content creator',
      data: {
        contentId,
        contentType,
        editRequest,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get verification statistics
exports.getVerificationStats = (req, res) => {
  try {
    const totalArticles = mockData.articles.length;
    const verifiedArticles = mockData.articles.filter(a => a.status === 'verified').length;
    const underReviewArticles = mockData.articles.filter(a => a.status === 'under review').length;
    const rejectedArticles = mockData.articles.filter(a => a.status === 'rejected').length;

    const totalPosts = mockData.communityPosts.length;
    const verifiedPosts = mockData.communityPosts.filter(p => p.status === 'verified').length;
    const underReviewPosts = mockData.communityPosts.filter(p => p.status === 'under review').length;
    const rejectedPosts = mockData.communityPosts.filter(p => p.status === 'rejected').length;

    const verificationRate = ((verifiedArticles + verifiedPosts) / (totalArticles + totalPosts) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      data: {
        articles: {
          total: totalArticles,
          verified: verifiedArticles,
          underReview: underReviewArticles,
          rejected: rejectedArticles,
        },
        posts: {
          total: totalPosts,
          verified: verifiedPosts,
          underReview: underReviewPosts,
          rejected: rejectedPosts,
        },
        overall: {
          totalContent: totalArticles + totalPosts,
          verifiedContent: verifiedArticles + verifiedPosts,
          verificationRate: `${verificationRate}%`,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
