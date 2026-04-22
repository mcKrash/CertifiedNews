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
      openTickets,
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
        user: {
          select: { id: true, name: true, username: true, userType: true },
        },
      },
    });

    const recentApplications = await prisma.reporterApplication.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
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
          openTickets,
        },
        recentPosts: recentPosts.map(post => ({
          id: post.id,
          content: post.content,
          author: post.user,
          createdAt: post.createdAt,
        })),
        recentApplications: recentApplications.map(app => ({
          id: app.id,
          user: app.user,
          status: app.status,
          submittedAt: app.submittedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Get reporter applications
 */
const getReporterApplications = async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const applications = await prisma.reporterApplication.findMany({
      where: { status },
      skip,
      take: parseInt(limit),
      orderBy: { submittedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, userType: true },
        },
      },
    });

    const total = await prisma.reporterApplication.count({ where: { status } });

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
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
      include: { user: true },
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
        reviewedBy: req.user.id,
      },
    });

    // Update user verification status
    await prisma.user.update({
      where: { id: application.userId },
      data: { isVerified: true },
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
        reviewNotes: reason || 'No reason provided',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
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
    });
  }
};

/**
 * Get users
 */
const getUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isVerified: true,
        isBanned: true,
        createdAt: true,
      },
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

/**
 * Ban user
 */
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const banExpiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: reason || 'No reason provided',
        banExpiresAt,
      },
    });

    res.status(200).json({
      success: true,
      message: 'User banned successfully',
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban user',
    });
  }
};

/**
 * Get support tickets
 */
const getSupportTickets = async (req, res) => {
  try {
    const { status = 'OPEN', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const tickets = await prisma.supportTicket.findMany({
      where: { status },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const total = await prisma.supportTicket.count({ where: { status } });

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
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
        resolution: resolution || 'Resolved by admin',
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
    });
  }
};

module.exports = {
  getDashboardStats,
  getReporterApplications,
  approveApplication,
  rejectApplication,
  getUsers,
  banUser,
  getSupportTickets,
  resolveTicket,
};
