'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { channels } from '@/lib/channels';
import CommentSection from '@/components/CommentSection';
import { HeartIcon, MessageCircleIcon, LinkChainIcon, CopyrightIcon, SupportIcon, PreferencesIcon } from '@/lib/icons';

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [liveNews, setLiveNews] = useState([]);
  const [showPostBox, setShowPostBox] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [articleLikes, setArticleLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [feedPreferences, setFeedPreferences] = useState({
    defaultCategory: 'all',
    verifiedOnly: true,
    liveTickerEnabled: true,
    compactFeed: false,
  });
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Post box state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postSourceUrl, setPostSourceUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const categories = [
    { id: 'all', name: 'All News', icon: '📰', categoryId: null },
    { id: 'sport', name: 'Sport', icon: '⚽', categoryId: 1 },
    { id: 'politics', name: 'Politics', icon: '🏛️', categoryId: 2 },
    { id: 'tech', name: 'Technology', icon: '💻', categoryId: 3 },
    { id: 'science', name: 'Science', icon: '🔬', categoryId: 4 },
    { id: 'health', name: 'Health', icon: '🏥', categoryId: 5 },
  ];

  useEffect(() => {
    const storedPreferences = localStorage.getItem('wcna_preferences');
    if (storedPreferences) {
      const parsedPreferences = JSON.parse(storedPreferences);
      setFeedPreferences((prev) => ({ ...prev, ...parsedPreferences }));
      if (parsedPreferences.defaultCategory) {
        setActiveCategory(parsedPreferences.defaultCategory);
      }
    }
  }, []);

  // Fetch live news for the ticker
  useEffect(() => {
    if (!feedPreferences.liveTickerEnabled) {
      setLiveNews([]);
      return;
    }

    const fetchLiveNews = async () => {
      try {
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=http://feeds.bbci.co.uk/news/rss.xml');
        const data = await response.json();
        if (data.status === 'ok') {
          setLiveNews(data.items.map(item => item.title));
        }
      } catch (error) {
        console.error('Error fetching live news:', error);
        setLiveNews([
          "Global markets react to new economic data",
          "SpaceX successfully launches latest satellite constellation",
          "New breakthrough in renewable energy storage announced",
          "World leaders gather for climate summit in Geneva",
          "Tech giants announce new AI safety standards"
        ]);
      }
    };
    fetchLiveNews();
  }, [feedPreferences.liveTickerEnabled]);

  // Fetch articles based on active category
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        
        // Filter articles based on active category
        let filtered = data;
        if (activeCategory !== 'all') {
          const selectedCategory = categories.find(c => c.id === activeCategory);
          if (selectedCategory) {
            filtered = data.filter((article: any) => article.categoryId === selectedCategory.categoryId);
          }
        }

        if (feedPreferences.verifiedOnly) {
          filtered = filtered.filter((article: any) => article.status === 'verified');
        }
        
        // Sort by published date (newest first)
        filtered.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        setArticles(filtered);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [activeCategory, feedPreferences.verifiedOnly]);

  // Real-time search functionality
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    // Search through articles
    articles.forEach((article: any) => {
      if (
        article.title.toLowerCase().includes(query) ||
        article.body.toLowerCase().includes(query) ||
        article.sourceName.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'article',
          id: article.id,
          title: article.title,
          body: article.body,
          category: getCategoryName(article.categoryId),
          source: article.sourceName,
          status: article.status,
        });
      }
    });

    // Search through categories
    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(query) && cat.id !== 'all') {
        results.push({
          type: 'category',
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
        });
      }
    });

    // Search through news channels
    channels.forEach((channel) => {
      if (channel.name.toLowerCase().includes(query)) {
        results.push({
          type: 'channel',
          id: channel.id,
          name: channel.name,
          avatar: channel.avatar,
        });
      }
    });

    setSearchResults(results.slice(0, 8));
    setShowSearchResults(true);
  }, [searchQuery, articles]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleNewPostClick = () => {
    setShowPostBox(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postContent) return;
    
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postTitle,
          content: postContent,
          sourceUrl: postSourceUrl,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to submit post: ${error.message || 'Unknown error'}`);
        setIsPosting(false);
        return;
      }

      alert('Post submitted for verification!');
      setPostTitle('');
      setPostContent('');
      setPostSourceUrl('');
      setIsPosting(false);
      setShowPostBox(false);
    } catch (error) {
      console.error('Error submitting post:', error);
      alert('Failed to submit post. Please try again.');
      setIsPosting(false);
    }
  };

  const closePostBox = () => {
    setShowPostBox(false);
  };

  const handleSearchResultClick = (result: any) => {
    if (result.type === 'category') {
      setActiveCategory(result.id);
      setSearchQuery('');
      setShowSearchResults(false);
    } else if (result.type === 'channel') {
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setShowMobileMenu(false);
  };

  const handleArticleLike = async (articleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const res = await fetch(`${API_URL}/votes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          type: 'LIKE',
        }),
      });

      if (!res.ok) {
        console.error('Failed to toggle like');
        return;
      }

      setArticleLikes(prev => {
        const current = prev[articleId] || { liked: false, count: Math.floor(Math.random() * 200) };
        return {
          ...prev,
          [articleId]: {
            liked: !current.liked,
            count: current.liked ? current.count - 1 : current.count + 1,
          },
        };
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const getArticleLikeData = (articleId: string) => {
    return articleLikes[articleId] || { liked: false, count: Math.floor(Math.random() * 200) };
  };

  const getTotalEngagement = (articleId: string) => {
    const likeData = getArticleLikeData(articleId);
    return likeData.count;
  };
  const getCommentCount = (articleId: string) => {
    return commentCounts[articleId] || 0;
  };

  const handleCommentAdded = (articleId: string) => {
    setCommentCounts(prev => ({
      ...prev,
      [articleId]: (prev[articleId] || 0) + 1,
    }));
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.categoryId === categoryId);
    return category ? category.name : 'News';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          {/* Logo */}
          <Link href="/home" className="flex items-center space-x-2 flex-shrink-0">
            <Image src="/logo.png" alt="WCNA Logo" width={48} height={48} className="rounded" />
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#2C3E50' }}>WCNA</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden flex flex-col gap-1.5 p-2 rounded-md"
            style={{ backgroundColor: '#F5F7FA' }}
            title="Menu"
          >
            <div className="w-6 h-0.5" style={{ backgroundColor: '#2C3E50' }}></div>
            <div className="w-6 h-0.5" style={{ backgroundColor: '#2C3E50' }}></div>
            <div className="w-6 h-0.5" style={{ backgroundColor: '#2C3E50' }}></div>
          </button>

          {/* Search Bar - Hidden on very small screens */}
          <div className="hidden sm:flex flex-1 max-w-md" ref={searchRef}>
            <div className="relative w-full">
              <div
                className="flex items-center gap-3 px-4 py-2 rounded-lg border"
                style={{ borderColor: '#E0E6ED', backgroundColor: '#F5F7FA' }}
              >
                <span className="text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  style={{ color: '#2C3E50' }}
                />
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg z-50"
                  style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}
                >
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <div key={idx}>
                        {result.type === 'article' && (
                          <button
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors"
                            style={{ borderColor: '#E0E6ED' }}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-lg flex-shrink-0">📰</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold" style={{ color: '#2C3E50' }}>
                                  {result.title}
                                </p>
                                <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>
                                  {result.body.substring(0, 60)}...
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs font-bold" style={{ color: '#00B4A0' }}>
                                    {result.category}
                                  </span>
                                  <span className="text-xs" style={{ color: '#95A5A6' }}>
                                    • {result.source}
                                  </span>
                                </div>
                              </div>
                              <div
                                className="px-2 py-1 rounded text-[10px] font-bold flex-shrink-0"
                                style={{
                                  backgroundColor: result.status === 'verified' ? '#E8F8F5' : '#FFF3CD',
                                  color: result.status === 'verified' ? '#00B4A0' : '#856404',
                                }}
                              >
                                {result.status === 'verified' ? '✓' : '⏳'}
                              </div>
                            </div>
                          </button>
                        )}

                        {result.type === 'category' && (
                          <button
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors flex items-center gap-3"
                            style={{ borderColor: '#E0E6ED' }}
                          >
                            <span className="text-lg">{result.icon}</span>
                            <div>
                              <p className="text-sm font-bold" style={{ color: '#2C3E50' }}>
                                {result.name}
                              </p>
                              <p className="text-xs" style={{ color: '#7F8C8D' }}>
                                Category
                              </p>
                            </div>
                          </button>
                        )}

                        {result.type === 'channel' && (
                          <button
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors flex items-center gap-3"
                            style={{ borderColor: '#E0E6ED' }}
                          >
                            <span className="text-lg">{result.avatar}</span>
                            <div>
                              <p className="text-sm font-bold" style={{ color: '#2C3E50' }}>
                                {result.name}
                              </p>
                              <p className="text-xs" style={{ color: '#7F8C8D' }}>
                                News Channel
                              </p>
                            </div>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Message */}
              {showSearchResults && searchResults.length === 0 && searchQuery.trim().length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg p-4 text-center"
                  style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}
                >
                  <p className="text-sm" style={{ color: '#7F8C8D' }}>
                    No results found for "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Profile & Logout */}
          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
            <Link
              href="/profile"
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 text-lg"
              style={{ borderColor: '#00B4A0' }}
            >
              <span style={{ color: '#00B4A0' }}>👤</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-semibold text-white"
              style={{ backgroundColor: '#E74C3C' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu - Floating under header */}
        {showMobileMenu && (
          <div
            className="lg:hidden border-t px-4 py-4 space-y-2"
            style={{ borderColor: '#E0E6ED', backgroundColor: '#F5F7FA' }}
          >
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                style={{
                  backgroundColor: activeCategory === cat.id ? '#00B4A0' : 'transparent',
                  color: activeCategory === cat.id ? '#FFFFFF' : '#2C3E50',
                }}
              >
                <span className="mr-3 text-lg">{cat.icon}</span>
                {cat.name}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t space-y-2" style={{ borderColor: '#DDE6ED' }}>
              <Link href="/support" className="w-full px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3" style={{ color: '#2C3E50' }}>
                <SupportIcon size={18} />
                Contact Us
              </Link>
              <Link href="/preferences" className="w-full px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3" style={{ color: '#2C3E50' }}>
                <PreferencesIcon size={18} />
                Preferences
              </Link>
              <div className="px-3 py-2 flex items-center gap-3 text-sm" style={{ color: '#7F8C8D' }}>
                <CopyrightIcon size={18} />
                <span>© 2026 WCNA</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Categories (Desktop only) */}
        <aside className="hidden lg:flex w-64 border-r p-6 sticky top-[73px] h-[calc(100vh-73px)] flex-col" style={{ borderColor: '#E0E6ED', backgroundColor: '#F5F7FA' }}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: '#2C3E50' }}>
              Categories
            </h3>
            <nav className="space-y-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  style={{
                    backgroundColor: activeCategory === cat.id ? '#00B4A0' : 'transparent',
                    color: activeCategory === cat.id ? '#FFFFFF' : '#2C3E50',
                  }}
                >
                  <span className="mr-3 text-lg">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto pt-6 border-t space-y-3" style={{ borderColor: '#DDE6ED' }}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-md" style={{ backgroundColor: '#FFFFFF' }}>
              <CopyrightIcon size={18} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#2C3E50' }}>WCNA Rights</p>
                <p className="text-xs" style={{ color: '#7F8C8D' }}>© 2026 World Certified News Alliance</p>
              </div>
            </div>

            <Link href="/support" className="flex items-center gap-3 px-3 py-3 rounded-md transition-colors hover:bg-white" style={{ color: '#2C3E50' }}>
              <SupportIcon size={18} />
              <div>
                <p className="text-sm font-semibold">Contact Us</p>
                <p className="text-xs" style={{ color: '#7F8C8D' }}>Customer care and issue submission</p>
              </div>
            </Link>

            <Link href="/preferences" className="flex items-center gap-3 px-3 py-3 rounded-md transition-colors hover:bg-white" style={{ color: '#2C3E50' }}>
              <PreferencesIcon size={18} />
              <div>
                <p className="text-sm font-semibold">Preferences</p>
                <p className="text-xs" style={{ color: '#7F8C8D' }}>Set your feed and safety options</p>
              </div>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full">
          {/* TV-Style Live News Status Bar */}
          {liveNews.length > 0 && (
            <div className="flex items-stretch rounded-lg overflow-hidden mb-8 h-8 lg:h-10 shadow-lg border-b-2 border-black/20">
              {/* LIVE Label (Red Section) */}
              <div className="bg-[#8B0000] flex items-center px-3 lg:px-6 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                  <span className="text-2xl lg:text-4xl">🌍</span>
                </div>
                <span className="text-white text-[10px] lg:text-xs font-black tracking-tighter italic animate-pulse relative z-10">LIVE</span>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/30"></div>
              </div>
              
              {/* Ticker Content (White Section with Black Text) */}
              <div className="flex-1 bg-white flex items-center overflow-hidden relative border-l-2 border-[#8B0000]">
                <div className="animate-marquee flex gap-12 whitespace-nowrap px-4">
                  {liveNews.concat(liveNews).map((news, idx) => (
                    <span key={idx} className="text-black text-[10px] lg:text-xs font-bold tracking-wide uppercase italic">
                      {news} <span className="mx-4 text-gray-400">•</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* News Channels - Instagram Stories Style */}
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>
              Channels of News
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {channels.map(channel => (
                <Link
                  key={channel.id}
                  href={`/channel/${channel.id}`}
                  className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 group-hover:opacity-80 transition-opacity p-1 group-hover:shadow-lg group-hover:scale-110 transition-all overflow-hidden"
                    style={{ borderColor: '#00B4A0', backgroundColor: '#FFFFFF' }}
                  >
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-bold mt-2 text-center" style={{ color: '#2C3E50', maxWidth: '64px' }}>
                    {channel.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Conditional Post Box - Only shown when showPostBox is true */}
          {showPostBox && (
            <div className="bg-white rounded-lg border mb-8 p-4 shadow-sm" style={{ borderColor: '#E0E6ED' }}>
              <div className="flex gap-3 mb-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg border flex-shrink-0">👤</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">Post a verified update</p>
                  <p className="text-[10px] text-gray-500">Help the community stay informed with sourced news</p>
                </div>
                <button
                  onClick={closePostBox}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handlePostSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Title of the news..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#00B4A0]"
                  style={{ borderColor: '#E0E6ED' }}
                />
                <textarea
                  placeholder="What's happening? (Post details)"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#00B4A0] resize-none"
                  style={{ borderColor: '#E0E6ED' }}
                />
                <div className="flex gap-2 flex-col sm:flex-row">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔗</span>
                    <input
                      type="url"
                      placeholder="Source URL (required for verification)"
                      value={postSourceUrl}
                      onChange={(e) => setPostSourceUrl(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 bg-gray-50 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#00B4A0]"
                      style={{ borderColor: '#E0E6ED' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPosting || !postTitle || !postContent}
                    className="px-6 py-2 rounded-md font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#00B4A0' }}
                  >
                    {isPosting ? 'Posting...' : 'Post News'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* News Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 flex-col sm:flex-row gap-2">
              <h2 className="text-xl font-bold" style={{ color: '#2C3E50' }}>
                {activeCategory === 'all' ? 'Latest News' : `${categories.find(c => c.id === activeCategory)?.name || 'News'}`}
              </h2>
              <div className="flex gap-2">
                <button className="text-xs font-bold text-[#00B4A0] hover:underline">Recent</button>
                <span className="text-gray-300">|</span>
                <button className="text-xs font-bold text-gray-400 hover:text-[#00B4A0]">Trending</button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <p style={{ color: '#7F8C8D' }}>Loading articles...</p>
              </div>
            )}

            {/* No Articles State */}
            {!loading && articles.length === 0 && (
              <div className="text-center py-12">
                <p style={{ color: '#7F8C8D' }}>No articles found in this category.</p>
              </div>
            )}

            {/* News Cards */}
            {!loading && articles.map((article: any) => (
              <article
                key={article.id}
                className={`rounded-lg border ${feedPreferences.compactFeed ? 'p-3 lg:p-4' : 'p-4 lg:p-6'} hover:shadow-md transition-shadow bg-white`}
                style={{ borderColor: '#E0E6ED' }}
              >
                <div className="flex items-start justify-between mb-4 flex-col sm:flex-row gap-2">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs flex-shrink-0">📰</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#00B4A0' }}>
                        {getCategoryName(article.categoryId)}
                      </p>
                      <Link href={`/article/${article.id}`}>
                        <h3 className="text-base lg:text-lg font-bold mt-1 leading-tight hover:text-[#00B4A0] transition-colors cursor-pointer" style={{ color: '#2C3E50' }}>
                          {article.title}
                        </h3>
                      </Link>
                    </div>
                  </div>
                  <div
                    className="px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 flex-shrink-0"
                    style={{ backgroundColor: article.status === 'verified' ? '#E8F8F5' : '#FFF3CD', color: article.status === 'verified' ? '#00B4A0' : '#856404' }}
                  >
                    <span>{article.status === 'verified' ? '✓' : '⏳'}</span> {article.status === 'verified' ? 'Verified' : 'Under Review'}
                  </div>
                </div>

                <p className="text-sm mb-4 leading-relaxed" style={{ color: '#7F8C8D' }}>
                  {article.body}
                </p>

                <div className="flex items-center justify-between pt-4 border-t flex-col sm:flex-row gap-2" style={{ borderColor: '#E0E6ED' }}>
                  <div className="flex items-center gap-4 text-[10px] font-bold" style={{ color: '#95A5A6' }}>
                    <span className="hover:text-[#00B4A0] cursor-pointer">{article.sourceName}</span>
                    <span>•</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleArticleLike(article.id)}
                      className="flex items-center gap-1.5 group hover:scale-110 transition-transform"
                    >
                      <HeartIcon filled={getArticleLikeData(article.id).liked} size={20} />
                      <span className="text-xs font-bold" style={{ color: getArticleLikeData(article.id).liked ? '#00B4A0' : '#95A5A6' }}>
                        {getTotalEngagement(article.id)}
                      </span>
                    </button>
                    <button
                      onClick={() => setExpandedComments(prev => ({ ...prev, [article.id]: !prev[article.id] }))}
                      className="flex items-center gap-1.5 group hover:scale-110 transition-transform"
                    >
                      <MessageCircleIcon size={20} />
                      <span className="text-xs font-bold" style={{ color: '#95A5A6' }}>{getCommentCount(article.id)}</span>
                    </button>
                    <button className="flex items-center gap-1.5 group hover:scale-110 transition-transform">
                      <LinkChainIcon size={20} />
                    </button>
                  </div>
                </div>

                {/* Comment Section */}
                <CommentSection articleId={article.id} articleTitle={article.title} onCommentAdded={() => handleCommentAdded(article.id)} isExpanded={expandedComments[article.id] || false} onToggleExpand={(expanded) => setExpandedComments(prev => ({ ...prev, [article.id]: expanded }))} />
              </article>
            ))}
          </div>
        </main>
      </div>

      {/* Floating "New Post" Button - Bottom Right */}
      {!showPostBox && (
        <button
          onClick={handleNewPostClick}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full text-white text-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
          style={{ backgroundColor: '#00B4A0' }}
          title="New Post"
        >
          +
        </button>
      )}

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
