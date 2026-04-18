'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { authenticatedFetch, getToken } from '@/lib/auth';

interface Article {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  imageUrl: string;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  status: string;
  trustScore: number;
  publishedAt: string;
  source: {
    id: string;
    name: string;
    logo: string;
    domain: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  replies: Comment[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await authenticatedFetch(`${API_URL}/articles/${articleId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch article');
        }

        setArticle(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const handleBookmark = async () => {
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const method = isBookmarked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/bookmarks/${articleId}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentText,
          articleId,
        }),
      });

      if (response.ok) {
        setCommentText('');
        // Refresh article to get new comments
        const articleResponse = await authenticatedFetch(`${API_URL}/articles/${articleId}`);
        const data = await articleResponse.json();
        setArticle(data.data);
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Article not found'}</p>
          <Link href="/home" className="text-teal-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/home" className="text-teal-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Image */}
        {article.imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden h-96 relative">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
              {article.category.name}
            </span>
            {article.status === 'VERIFIED' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                ✓ Verified
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

          {/* Source and Meta Info */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div className="flex items-center gap-4">
              {article.source.logo && (
                <Image
                  src={article.source.logo}
                  alt={article.source.name}
                  width={40}
                  height={40}
                  className="rounded"
                />
              )}
              <div>
                <p className="font-semibold">{article.source.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBookmark}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isBookmarked
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isBookmarked ? '📌 Saved' : '📌 Save'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-gray-600 mb-6">
            <span>👁️ {article.viewCount} views</span>
            <span>👍 {article.likeCount} likes</span>
            <span>💬 {article.commentCount} comments</span>
          </div>
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
            {article.body}
          </p>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Comments ({article.commentCount})</h2>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-8 pb-8 border-b">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={4}
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50"
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {article.comments && article.comments.length > 0 ? (
              article.comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-teal-200 pl-4">
                  <div className="flex items-center gap-3 mb-2">
                    {comment.user.avatar && (
                      <Image
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{comment.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
