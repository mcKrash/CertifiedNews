const express = require('express');
const router = express.Router();
const reporterAppController = require('../controllers/reporterApplicationController');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * @route   POST /api/reporter-applications
 * @desc    Submit a reporter application
 * @access  Private (USER)
 */
router.post(
  '/',
  verifyToken,
  reporterAppController.submitApplication
);

/**
 * @route   GET /api/reporter-applications/my-application
 * @desc    Get current user's application
 * @access  Private (USER)
 */
router.get(
  '/my-application',
  verifyToken,
  reporterAppController.getMyApplication
);

/**
 * @route   GET /api/reporter-applications
 * @desc    Get all applications (admin only)
 * @access  Private (ADMIN)
 */
router.get(
  '/',
  verifyToken,
  requireRole('ADMIN'),
  reporterAppController.getAllApplications
);

/**
 * @route   PATCH /api/reporter-applications/:applicationId
 * @desc    Review application (admin only)
 * @access  Private (ADMIN)
 */
router.patch(
  '/:applicationId',
  verifyToken,
  requireRole('ADMIN'),
  reporterAppController.reviewApplication
);

module.exports = router;
