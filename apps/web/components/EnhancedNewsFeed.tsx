'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader, RefreshCw } from 'lucide-react';
import EnhancedPostCard from './EnhancedPostCard';

interface Post {
  id: string;
  content: string;
  images?: string[];
  links?: string[];
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    userType: 'REGULAR_USER' | 'JOURNALIST' | 'AGENCY';
    isVerified: boolean;
  };
  userType: 'REGULAR_USER' | 'JOURNALIST' | 'AGENCY';
  isVerified: boolean;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
}

interface EnhancedNewsFeedProps {
  userId?: string;
  topicsOfInterest?: string[];
  onPostsLoaded?: (posts: Post[]) => void;
}

export default function EnhancedNewsFeed({ userId, topicsOfInterest = [], onPostsLoaded }: EnhancedNewsFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts?page=${pageNum}&limit=10${userId ? `&userId=${userId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      if (refresh) {
        setPosts(data.data);
      } else if (pageNum === 1) {
        setPosts(data.data);
      } else {
        setPosts(prev => [...prev, ...data.data]);
      }

      setHasMore(pageNum < data.pagination.pages);
      setPage(pageNum);

      if (onPostsLoaded) {
        onPostsLoaded(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, onPostsLoaded]);

  // Initial load
  useEffect(() => {
    fetchPosts(1);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !refreshing) {
          fetchPosts(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading, refreshing, fetchPosts]);

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          postId,
          voteType: 'LIKE',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                liked: !post.liked,
                likes: post.liked ? post.likes - 1 : post.likes + 1,
              }
            : post
        )
      );
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to bookmark post');
      }

      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, bookmarked: !post.bookmarked }
            : post
        )
      );
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          text: post.content.substring(0, 100),
          url: `${window.location.origin}/post/${postId}`,
        });
      } else {
        // Fallback: copy to clipboard
        const url = `${window.location.origin}/post/${postId}`;
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }

      // Track share
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center" style={{ borderColor: '#E0E6ED' }}>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchPosts(1, true)}
          className="px-4 py-2 bg-[#00B4A0] text-white rounded-lg font-medium hover:bg-[#009985]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-[#00B4A0]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={() => fetchPosts(1, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          style={{ borderColor: '#E0E6ED' }}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center" style={{ borderColor: '#E0E6ED' }}>
          <p className="text-gray-500 mb-4">No posts yet. Start following people to see their posts!</p>
        </div>
      ) : (
        posts.map(post => (
          <EnhancedPostCard
            key={post.id}
            {...post}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onShare={handleShare}
          />
        ))
      )}

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="py-8 text-center">
        {loading && posts.length > 0 && (
          <Loader className="animate-spin text-[#00B4A0] mx-auto" size={32} />
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-500">You've reached the end of the feed</p>
        )}
      </div>
    </div>
  );
}
