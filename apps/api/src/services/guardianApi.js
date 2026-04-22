const axios = require('axios');

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || 'test-key';
const GUARDIAN_API_URL = 'https://content.guardianapis.com/search';

// Category mapping
const CATEGORY_MAPPING = {
  'world': 'world',
  'politics': 'politics',
  'business': 'business',
  'technology': 'technology',
  'science': 'science',
  'environment': 'environment',
  'sport': 'sport',
  'culture': 'culture',
  'opinion': 'commentisfree',
  'health': 'lifeandstyle',
};

/**
 * Fetch articles from Guardian API
 */
const fetchArticles = async (category = 'world', page = 1, pageSize = 10) => {
  try {
    const guardianCategory = CATEGORY_MAPPING[category.toLowerCase()] || 'world';

    const response = await axios.get(`${GUARDIAN_API_URL}`, {
      params: {
        'api-key': GUARDIAN_API_KEY,
        section: guardianCategory,
        'page-size': pageSize,
        page,
        'show-fields': 'headline,standfirst,thumbnail,byline,publication',
        'show-tags': 'contributor',
        format: 'json',
      },
    });

    if (!response.data.response) {
      return {
        articles: [],
        total: 0,
        pages: 0,
      };
    }

    const articles = response.data.response.results.map(article => ({
      id: article.id,
      title: article.webTitle,
      description: article.fields?.standfirst || '',
      content: article.fields?.standfirst || '',
      imageUrl: article.fields?.thumbnail || null,
      author: article.fields?.byline || 'The Guardian',
      source: 'The Guardian',
      sourceUrl: article.webUrl,
      category: guardianCategory,
      publishedAt: article.webPublicationDate,
      url: article.webUrl,
      tags: article.tags?.map(tag => tag.webTitle) || [],
    }));

    return {
      articles,
      total: response.data.response.total,
      pages: response.data.response.pages,
      currentPage: response.data.response.currentPage,
    };
  } catch (error) {
    console.error('Guardian API error:', error.message);
    return {
      articles: [],
      total: 0,
      pages: 0,
      error: error.message,
    };
  }
};

/**
 * Search articles by keyword
 */
const searchArticles = async (query, page = 1, pageSize = 10) => {
  try {
    const response = await axios.get(`${GUARDIAN_API_URL}`, {
      params: {
        'api-key': GUARDIAN_API_KEY,
        q: query,
        'page-size': pageSize,
        page,
        'show-fields': 'headline,standfirst,thumbnail,byline,publication',
        'show-tags': 'contributor',
        format: 'json',
      },
    });

    if (!response.data.response) {
      return {
        articles: [],
        total: 0,
        pages: 0,
      };
    }

    const articles = response.data.response.results.map(article => ({
      id: article.id,
      title: article.webTitle,
      description: article.fields?.standfirst || '',
      content: article.fields?.standfirst || '',
      imageUrl: article.fields?.thumbnail || null,
      author: article.fields?.byline || 'The Guardian',
      source: 'The Guardian',
      sourceUrl: article.webUrl,
      category: article.sectionName,
      publishedAt: article.webPublicationDate,
      url: article.webUrl,
      tags: article.tags?.map(tag => tag.webTitle) || [],
    }));

    return {
      articles,
      total: response.data.response.total,
      pages: response.data.response.pages,
      currentPage: response.data.response.currentPage,
    };
  } catch (error) {
    console.error('Guardian API search error:', error.message);
    return {
      articles: [],
      total: 0,
      pages: 0,
      error: error.message,
    };
  }
};

/**
 * Get trending articles
 */
const getTrendingArticles = async (pageSize = 10) => {
  try {
    const response = await axios.get(`${GUARDIAN_API_URL}`, {
      params: {
        'api-key': GUARDIAN_API_KEY,
        'order-by': 'newest',
        'page-size': pageSize,
        'show-fields': 'headline,standfirst,thumbnail,byline,publication',
        'show-tags': 'contributor',
        format: 'json',
      },
    });

    if (!response.data.response) {
      return {
        articles: [],
      };
    }

    const articles = response.data.response.results.map(article => ({
      id: article.id,
      title: article.webTitle,
      description: article.fields?.standfirst || '',
      content: article.fields?.standfirst || '',
      imageUrl: article.fields?.thumbnail || null,
      author: article.fields?.byline || 'The Guardian',
      source: 'The Guardian',
      sourceUrl: article.webUrl,
      category: article.sectionName,
      publishedAt: article.webPublicationDate,
      url: article.webUrl,
      tags: article.tags?.map(tag => tag.webTitle) || [],
    }));

    return {
      articles,
    };
  } catch (error) {
    console.error('Guardian API trending error:', error.message);
    return {
      articles: [],
      error: error.message,
    };
  }
};

module.exports = {
  fetchArticles,
  searchArticles,
  getTrendingArticles,
  CATEGORY_MAPPING,
};
