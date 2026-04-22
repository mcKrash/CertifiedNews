'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Loader2 } from 'lucide-react';
import EnhancedPostCard from './EnhancedPostCard';
import CategoryFilter from './CategoryFilter';

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    userType: 'REGULAR_USER' | 'JOURNALIST' | 'AGENCY';
    isVerified: boolean;
  };
  likes: number;
  comments: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
}

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  author: string;
  source: string;
  sourceUrl: string;
  category: string;
  publishedAt: string;
  url: string;
  bookmarked?: boolean;
}

interface FeedItem {
  type: 'post' | 'news';
  data: Post | NewsArticle;
}

export default function MixedFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('world');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const fetchFeed = useCallback(async (pageNum: number, category: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/news/feed?page=${pageNum}&limit=10&categories=${category}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const result = await response.json();

      if (pageNum === 1) {
        setFeedItems(result.data || []);
      } else {
        setFeedItems(prev => [...prev, ...(result.data || [])]);
      }

      setHasMore(result.data?.length === 10);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    setPage(1);
    fetchFeed(1, selectedCategory);
  }, [selectedCategory, fetchFeed]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, selectedCategory);
  };

  const handleLike = async (itemId: string, isPost: boolean): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isPost ? '/votes' : '/votes';
      const payload = isPost ? { postId: itemId } : { articleId: itemId };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFeedItems(prev =>
          prev.map(item => {
            if (item.type === 'post' && item.data.id === itemId) {
              const postData = item.data as Post;
              return {
                ...item,
                data: {
                  ...postData,
                  liked: !postData.liked,
                  likes: postData.liked ? postData.likes - 1 : postData.likes + 1,
                },
              };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleBookmark = async (itemId: string, isPost: boolean): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const payload = isPost ? { postId: itemId } : { articleId: itemId };

      const response = await fetch(`${API_URL}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFeedItems(prev =>
          prev.map(item => {
            if (item.type === 'post' && item.data.id === itemId) {
              const postData = item.data as Post;
              return {
                ...item,
                data: {
                  ...postData,
                  bookmarked: !postData.bookmarked,
                },
              };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleShare = async (item: FeedItem): Promise<void> => {
    const text =
      item.type === 'post'
        ? (item.data as Post).content
        : (item.data as NewsArticle).title;

    if (navigator.share) {
      navigator.share({
        title: 'Check this out',
        text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div className="w-full">
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-700">
            {error}
          </div>
        )}

        {feedItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No content available</p>
          </div>
        )}

        <div className="space-y-4 p-4">
          {feedItems.map((item, index) => (
            <div key={`${item.type}-${item.data.id}-${index}`}>
              {item.type === 'post' ? (
                <EnhancedPostCard
                  {...(item.data as Post)}
                  shares={0}
                  onLike={async () => handleLike(item.data.id, true)}
                  onBookmark={async () => handleBookmark(item.data.id, true)}
                  onShare={async () => handleShare(item)}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4">
                    {(item.data as NewsArticle).imageUrl && (
                      <img
                        src={(item.data as NewsArticle).imageUrl}
                        alt={(item.data as NewsArticle).title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                          {(item.data as NewsArticle).title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {(item.data as NewsArticle).description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <span className="font-medium">
                            {(item.data as NewsArticle).source}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(
                              (item.data as NewsArticle).publishedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <a
                        href={(item.data as NewsArticle).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-500 hover:text-teal-600 text-sm font-medium"
                      >
                        Read Full Article →
                      </a>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleBookmark(item.data.id, false)}
                          className="text-gray-400 hover:text-teal-500 transition-colors"
                        >
                          <Bookmark
                            size={18}
                            fill={
                              feedItems.find(i => i.data.id === item.data.id)
                                ?.data.bookmarked
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>
                        <button
                          onClick={() => handleShare(item)}
                          className="text-gray-400 hover:text-teal-500 transition-colors"
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-teal-500" size={32} />
          </div>
        )}

        {hasMore && !loading && feedItems.length > 0 && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors font-medium"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
