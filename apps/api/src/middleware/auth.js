const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from Authorization header
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
    });
  }
};

/**
 * Require specific user roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Check if user is banned
 */
const checkBanStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user && user.isBanned) {
      if (user.banExpiresAt && new Date(user.banExpiresAt) > new Date()) {
        return res.status(403).json({
          success: false,
          message: `Your account is temporarily banned until ${user.banExpiresAt}. Reason: ${user.banReason}`,
        });
      } else if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: `Your account is permanently banned. Reason: ${user.banReason}`,
        });
      }
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Ban check error:', error);
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  checkBanStatus,
};
