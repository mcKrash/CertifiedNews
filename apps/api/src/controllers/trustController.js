const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Calculate trust score for an article
 */
const calculateArticleTrustScore = (article, source) => {
  let score = 50; // Base score

  // Source verification (±30 points)
  if (source.isVerified) {
    score += 20;
  }
  score += Math.min(source.trustScore / 10, 10); // Max +10 from source trust

  // Engagement metrics (±20 points)
  const totalEngagement = article._count.votes + article._count.comments;
  if (totalEngagement > 100) score += 10;
  if (totalEngagement > 500) score += 10;

  // Age factor (±10 points)
  const ageInDays = (new Date() - article.publishedAt) / (1000 * 60 * 60 * 24);
  if (ageInDays < 1) score += 5; // Recent articles get slight boost
  if (ageInDays > 30) score -= 5; // Older articles lose points

  // Normalize to 0-100
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Get article trust score
 */
const getArticleTrustScore = async (req, res) => {
  try {
    const { articleId } = req.params;

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        source: true,
        _count: {
          select: { votes: true, comments: true },
        },
      },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    const trustScore = calculateArticleTrustScore(article, article.source);

    res.status(200).json({
      success: true,
      data: {
        articleId: article.id,
        trustScore,
        sourceVerified: article.source.isVerified,
        sourceTrustScore: article.source.trustScore,
        engagementScore: article._count.votes + article._count.comments,
        status: article.status,
      },
    });
  } catch (error) {
    console.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trust score',
      error: error.message,
    });
  }
};

/**
 * Get source trust profile
 */
const getSourceTrustProfile = async (req, res) => {
  try {
    const { sourceId } = req.params;

    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      include: {
        articles: {
          where: { status: 'VERIFIED' },
          include: {
            _count: {
              select: { votes: true, comments: true },
            },
          },
          take: 10,
        },
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Source not found',
      });
    }

    // Calculate average engagement
    const avgEngagement =
      source.articles.length > 0
        ? source.articles.reduce(
            (sum, a) => sum + a._count.votes + a._count.comments,
            0
          ) / source.articles.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        sourceId: source.id,
        name: source.name,
        domain: source.domain,
        isVerified: source.isVerified,
        trustScore: source.trustScore,
        totalArticles: source._count.articles,
        averageEngagement: Math.round(avgEngagement),
        recentArticles: source.articles.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Get source trust profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch source trust profile',
      error: error.message,
    });
  }
};

/**
 * Update source trust score (admin only)
 */
const updateSourceTrustScore = async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { trustScore, isVerified, notes } = req.body;

    if (trustScore < 0 || trustScore > 100) {
      return res.status(400).json({
        success: false,
        message: 'Trust score must be between 0 and 100',
      });
    }

    const source = await prisma.source.update({
      where: { id: sourceId },
      data: {
        trustScore: parseInt(trustScore),
        isVerified: isVerified !== undefined ? isVerified : undefined,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Source trust score updated',
      data: source,
    });
  } catch (error) {
    console.error('Update trust score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trust score',
      error: error.message,
    });
  }
};

/**
 * Get trust statistics
 */
const getTrustStatistics = async (req, res) => {
  try {
    const [verifiedSources, totalSources, avgTrustScore, verifiedArticles] =
      await Promise.all([
        prisma.source.count({ where: { isVerified: true } }),
        prisma.source.count(),
        prisma.source.aggregate({
          _avg: { trustScore: true },
        }),
        prisma.article.count({ where: { status: 'VERIFIED' } }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        verifiedSources,
        totalSources,
        verificationPercentage: Math.round((verifiedSources / totalSources) * 100),
        averageTrustScore: Math.round(verifiedSources._avg?.trustScore || 0),
        verifiedArticles,
      },
    });
  } catch (error) {
    console.error('Get trust statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trust statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getArticleTrustScore,
  getSourceTrustProfile,
  updateSourceTrustScore,
  getTrustStatistics,
};
