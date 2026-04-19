const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * @route   POST /api/support
 * @desc    Submit a support ticket
 * @access  Public (Optional Auth)
 */
router.post('/', (req, res, next) => {
  // Try to verify token but don't fail if not provided
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, supportController.submitTicket);

/**
 * @route   POST /api/support/submit
 * @desc    Submit a support ticket (legacy endpoint)
 * @access  Public (Optional Auth)
 */
router.post('/submit', (req, res, next) => {
  // Try to verify token but don't fail if not provided
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, supportController.submitTicket);

/**
 * @route   GET /api/support/my-tickets
 * @desc    Get current user's tickets
 * @access  Private
 */
router.get('/my-tickets', verifyToken, supportController.getMyTickets);

/**
 * @route   GET /api/support/all
 * @desc    Get all support tickets (admin only)
 * @access  Private (ADMIN)
 */
router.get('/all', verifyToken, requireRole('ADMIN'), supportController.getAllTickets);

/**
 * @route   PATCH /api/support/:ticketId
 * @desc    Update ticket status (admin only)
 * @access  Private (ADMIN)
 */
router.patch('/:ticketId', verifyToken, requireRole('ADMIN'), supportController.updateTicketStatus);

module.exports = router;
