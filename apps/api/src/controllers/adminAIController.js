const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * AI analysis for article moderation
 */
const analyzeArticle = async (req, res) => {
  try {
    const { articleId } = req.body;

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    // Mock AI analysis logic
    // In a real implementation, this would call an LLM API
    const analysis = {
      sentiment: 'Neutral',
      safetyScore: 0.95,
      potentialBias: 'Low',
      isFactChecked: true,
      recommendation: 'VERIFY',
      reasoning: 'The article uses neutral language and cites multiple sources.',
    };

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform AI analysis',
      error: error.message,
    });
  }
};

/**
 * AI analysis for reporter applications
 */
const analyzeApplication = async (req, res) => {
  try {
    const { applicationId } = req.body;

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

    // Mock AI analysis logic
    const analysis = {
      professionalism: 0.88,
      experienceScore: 0.75,
      portfolioQuality: 0.9,
      recommendation: 'APPROVE',
      notes: 'Applicant shows strong writing skills and relevant portfolio.',
    };

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform AI analysis',
      error: error.message,
    });
  }
};

module.exports = {
  analyzeArticle,
  analyzeApplication,
};
