const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(verifyToken, verifyAdmin);

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/stats', adminDashboardController.getDashboardStats);

/**
 * @route   GET /api/admin/dashboard/applications
 * @desc    Get reporter applications
 * @access  Admin
 */
router.get('/applications', adminDashboardController.getReporterApplications);

/**
 * @route   POST /api/admin/dashboard/applications/:applicationId/approve
 * @desc    Approve reporter application
 * @access  Admin
 */
router.post(
  '/applications/:applicationId/approve',
  adminDashboardController.approveApplication
);

/**
 * @route   POST /api/admin/dashboard/applications/:applicationId/reject
 * @desc    Reject reporter application
 * @access  Admin
 */
router.post(
  '/applications/:applicationId/reject',
  adminDashboardController.rejectApplication
);

/**
 * @route   GET /api/admin/dashboard/users
 * @desc    Get all users for management
 * @access  Admin
 */
router.get('/users', adminDashboardController.getUsers);

/**
 * @route   POST /api/admin/dashboard/users/:userId/suspend
 * @desc    Suspend user
 * @access  Admin
 */
router.post('/users/:userId/suspend', adminDashboardController.suspendUser);

/**
 * @route   GET /api/admin/dashboard/tickets
 * @desc    Get support tickets
 * @access  Admin
 */
router.get('/tickets', adminDashboardController.getSupportTickets);

/**
 * @route   POST /api/admin/dashboard/tickets/:ticketId/resolve
 * @desc    Resolve support ticket
 * @access  Admin
 */
router.post(
  '/tickets/:ticketId/resolve',
  adminDashboardController.resolveTicket
);

module.exports = router;
