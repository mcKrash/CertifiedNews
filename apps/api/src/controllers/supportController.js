const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Submit a support ticket
 */
const submitTicket = async (req, res) => {
  try {
    const { email, subject, description, category, priority, articleUrl } = req.body;
    const userId = req.user ? req.user.id : null;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        email,
        subject,
        description,
        category: category || 'technical_issue',
        priority: priority || 'normal',
        articleUrl,
        status: 'OPEN',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Submit ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket',
      error: error.message,
    });
  }
};

/**
 * Get user's support tickets
 */
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
      error: error.message,
    });
  }
};

/**
 * Get all support tickets (admin only)
 */
const getAllTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all support tickets',
      error: error.message,
    });
  }
};

/**
 * Update ticket status (admin only)
 */
const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support ticket',
      error: error.message,
    });
  }
};

module.exports = {
  submitTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
};
