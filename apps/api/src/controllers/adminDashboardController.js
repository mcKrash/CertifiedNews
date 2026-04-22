const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      pendingApplications,
      verifiedJournalists,
      verifiedAgencies,
      totalArticles,
      reportedContent,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.reporterApplication.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { userType: 'JOURNALIST', isVerified: true } }),
      prisma.user.count({ where: { userType: 'AGENCY', isVerified: true } }),
      prisma.article.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    ]);

    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    const recentApplications = await prisma.reporterApplication.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { status: 'PENDING' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPosts,
          totalComments,
          pendingApplications,
          verifiedJournalists,
          verifiedAgencies,
          totalArticles,
          reportedContent,
        },
        recentPosts,
        recentApplications,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * Get all reporter applications
 */
const getReporterApplications = async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await prisma.reporterApplication.findMany({
      where: status ? { status } : {},
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    const total = await prisma.reporterApplication.count({
      where: status ? { status } : {},
    });

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
};

/**
 * Approve reporter application
 */
const approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.reporterApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Update application status
    await prisma.reporterApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
      },
    });

    // Update user verification status
    await prisma.user.update({
      where: { id: application.userId },
      data: {
        isVerified: true,
        userType: 'JOURNALIST',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Application approved successfully',
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve application',
      error: error.message,
    });
  }
};

/**
 * Reject reporter application
 */
const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    const application = await prisma.reporterApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Update application status
    await prisma.reporterApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Application rejected successfully',
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message,
    });
  }
};

/**
 * Get all users for management
 */
const getUsers = async (req, res) => {
  try {
    const { userType, isVerified, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (userType) where.userType = userType;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';

    const users = await prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        userType: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { posts: true, followers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({ where });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

/**
 * Suspend user
 */
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspensionReason: reason,
      },
    });

    res.status(200).json({
      success: true,
      message: 'User suspended successfully',
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message,
    });
  }
};

/**
 * Get support tickets
 */
const getSupportTickets = async (req, res) => {
  try {
    const { status = 'OPEN', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await prisma.supportTicket.findMany({
      where: status ? { status } : {},
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const total = await prisma.supportTicket.count({
      where: status ? { status } : {},
    });

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
      error: error.message,
    });
  }
};

/**
 * Resolve support ticket
 */
const resolveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { resolution } = req.body;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Ticket resolved successfully',
    });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve ticket',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getReporterApplications,
  approveApplication,
  rejectApplication,
  getUsers,
  suspendUser,
  getSupportTickets,
  resolveTicket,
};
