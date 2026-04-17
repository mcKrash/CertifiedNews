const mockData = require('../data/mockData');

// Get all trusted sources
exports.getAllSources = (req, res) => {
  try {
    const { trustLevel, limit = 50, offset = 0 } = req.query;

    let sources = mockData.sources || [];

    if (trustLevel) {
      sources = sources.filter(s => s.trustLevel === trustLevel);
    }

    const paginatedSources = sources.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedSources,
      pagination: {
        total: sources.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < sources.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get source by domain
exports.getSourceByDomain = (req, res) => {
  try {
    const { domain } = req.params;

    const source = (mockData.sources || []).find(s => s.domain === domain);

    if (!source) {
      return res.status(404).json({ success: false, error: 'Source not found' });
    }

    res.status(200).json({ success: true, data: source });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add new source to whitelist (admin only)
exports.addSource = (req, res) => {
  try {
    const { domain, name, trustLevel, category } = req.body;

    if (!domain || !name || !trustLevel) {
      return res.status(400).json({
        success: false,
        error: 'domain, name, and trustLevel are required',
      });
    }

    if (!mockData.sources) {
      mockData.sources = [];
    }

    const existingSource = mockData.sources.find(s => s.domain === domain);
    if (existingSource) {
      return res.status(400).json({
        success: false,
        error: 'Source already exists',
      });
    }

    const newSource = {
      id: (mockData.sources.length || 0) + 1,
      domain,
      name,
      trustLevel, // 'high', 'medium', 'blocked'
      category: category || 'general',
      verifiedByAdmin: true,
      addedAt: new Date().toISOString(),
    };

    mockData.sources.push(newSource);

    res.status(201).json({
      success: true,
      message: 'Source added to whitelist',
      data: newSource,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update source trust level (admin only)
exports.updateSourceTrustLevel = (req, res) => {
  try {
    const { domain } = req.params;
    const { trustLevel } = req.body;

    if (!mockData.sources) {
      mockData.sources = [];
    }

    const source = mockData.sources.find(s => s.domain === domain);

    if (!source) {
      return res.status(404).json({ success: false, error: 'Source not found' });
    }

    const oldTrustLevel = source.trustLevel;
    source.trustLevel = trustLevel;

    res.status(200).json({
      success: true,
      message: 'Source trust level updated',
      data: {
        domain,
        oldTrustLevel,
        newTrustLevel: trustLevel,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Remove source from whitelist (admin only)
exports.removeSource = (req, res) => {
  try {
    const { domain } = req.params;

    if (!mockData.sources) {
      mockData.sources = [];
    }

    const sourceIndex = mockData.sources.findIndex(s => s.domain === domain);

    if (sourceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Source not found' });
    }

    const removedSource = mockData.sources.splice(sourceIndex, 1)[0];

    res.status(200).json({
      success: true,
      message: 'Source removed from whitelist',
      data: removedSource,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify source credibility
exports.verifySourceCredibility = (req, res) => {
  try {
    const { domain } = req.params;

    if (!mockData.sources) {
      mockData.sources = [];
    }

    const source = mockData.sources.find(s => s.domain === domain);

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found',
        credible: false,
      });
    }

    const isCredible = source.trustLevel !== 'blocked';

    res.status(200).json({
      success: true,
      data: {
        domain,
        credible: isCredible,
        trustLevel: source.trustLevel,
        name: source.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get sources by category
exports.getSourcesByCategory = (req, res) => {
  try {
    const { category } = req.params;

    if (!mockData.sources) {
      mockData.sources = [];
    }

    const sources = mockData.sources.filter(s => s.category === category);

    res.status(200).json({
      success: true,
      data: sources,
      count: sources.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get source statistics
exports.getSourceStats = (req, res) => {
  try {
    if (!mockData.sources) {
      mockData.sources = [];
    }

    const highTrustSources = mockData.sources.filter(s => s.trustLevel === 'high').length;
    const mediumTrustSources = mockData.sources.filter(s => s.trustLevel === 'medium').length;
    const blockedSources = mockData.sources.filter(s => s.trustLevel === 'blocked').length;

    res.status(200).json({
      success: true,
      data: {
        totalSources: mockData.sources.length,
        byTrustLevel: {
          high: highTrustSources,
          medium: mediumTrustSources,
          blocked: blockedSources,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
