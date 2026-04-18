const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Submit a reporter application
 */
const submitApplication = async (req, res) => {
  try {
    const { bio, experience, portfolio, reason } = req.body;
    const userId = req.user.id;

    // Check if user already has an application
    const existingApp = await prisma.reporterApplication.findUnique({
      where: { userId },
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or completed application',
      });
    }

    // Check if user is already a reporter
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role === 'REPORTER' || user.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'You are already a reporter',
      });
    }

    // Create application
    const application = await prisma.reporterApplication.create({
      data: {
        userId,
        bio,
        experience,
        portfolio,
        reason,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message,
    });
  }
};

/**
 * Get user's application status
 */
const getMyApplication = async (req, res) => {
  try {
    const userId = req.user.id;

    const application = await prisma.reporterApplication.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message,
    });
  }
};

/**
 * Get all applications (admin only)
 */
const getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [applications, total] = await Promise.all([
      prisma.reporterApplication.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.reporterApplication.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
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
 * Review application (admin only)
 */
const reviewApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be APPROVED or REJECTED',
      });
    }

    const application = await prisma.reporterApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Update application
    const updatedApp = await prisma.reporterApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: adminId,
        reviewNotes: notes,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // If approved, promote user to REPORTER
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: 'REPORTER', isVerified: true },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: application.userId,
          type: 'ARTICLE_VERIFIED',
          title: 'Reporter Status Granted',
          message: 'Congratulations! Your reporter application has been approved.',
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      data: updatedApp,
    });
  } catch (error) {
    console.error('Review application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review application',
      error: error.message,
    });
  }
};

module.exports = {
  submitApplication,
  getMyApplication,
  getAllApplications,
  reviewApplication,
};
