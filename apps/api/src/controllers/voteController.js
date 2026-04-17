const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Add or remove like/vote on article or post
 */
const toggleVote = async (req, res) => {
  try {
    const { articleId, postId, type = 'LIKE' } = req.body;
    const userId = req.user.id;

    if (!articleId && !postId) {
      return res.status(400).json({
        success: false,
        message: 'Either articleId or postId is required',
      });
    }

    // Check if vote already exists
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId,
        articleId: articleId || null,
        postId: postId || null,
        type,
      },
    });

    let vote;
    if (existingVote) {
      // Remove vote if it exists
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
      vote = null;
    } else {
      // Create new vote
      vote = await prisma.vote.create({
        data: {
          userId,
          articleId: articleId || null,
          postId: postId || null,
          type,
        },
      });
    }

    // Get updated vote count
    const voteCount = await prisma.vote.count({
      where: {
        articleId: articleId || null,
        postId: postId || null,
        type,
      },
    });

    res.status(200).json({
      success: true,
      message: existingVote ? 'Vote removed' : 'Vote added',
      data: {
        voted: !existingVote,
        voteCount,
      },
    });
  } catch (error) {
    console.error('Toggle vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle vote',
      error: error.message,
    });
  }
};

/**
 * Get vote count for article or post
 */
const getVoteCount = async (req, res) => {
  try {
    const { articleId, postId, type = 'LIKE' } = req.query;

    if (!articleId && !postId) {
      return res.status(400).json({
        success: false,
        message: 'Either articleId or postId is required',
      });
    }

    const voteCount = await prisma.vote.count({
      where: {
        articleId: articleId || null,
        postId: postId || null,
        type,
      },
    });

    // Check if current user has voted
    let userVoted = false;
    if (req.user) {
      const userVote = await prisma.vote.findFirst({
        where: {
          userId: req.user.id,
          articleId: articleId || null,
          postId: postId || null,
          type,
        },
      });
      userVoted = !!userVote;
    }

    res.status(200).json({
      success: true,
      data: {
        voteCount,
        userVoted,
      },
    });
  } catch (error) {
    console.error('Get vote count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vote count',
      error: error.message,
    });
  }
};

module.exports = {
  toggleVote,
  getVoteCount,
};
