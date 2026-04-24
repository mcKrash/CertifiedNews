'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { channels } from '@/lib/channels';
import { logoutUser } from '@/lib/auth';
import CommentSection from '@/components/CommentSection';
import { HeartIcon, MessageCircleIcon, LinkChainIcon } from '@/lib/icons';

// Wrapper components to handle icon styling
const StyledHeartIcon = ({ size = 20 }: { size?: number }) => <HeartIcon size={size} />;
const StyledMessageCircleIcon = ({ size = 20 }: { size?: number }) => <MessageCircleIcon size={size} />;
const StyledLinkChainIcon = ({ size = 20 }: { size?: number }) => <LinkChainIcon size={size} />;

interface Article {
  id: string;
  title: string;
  body: string;
  channelId: number;
  channelName: string;
  sourceUrl: string;
  sourceName: string;
  status: string;
  publishedAt: string;
  imageUrl: string | null;
  viewCount: number;
}

interface ArticleLikeData {
  liked: boolean;
  count: number;
}

export default function ChannelPage() {
  const router = useRouter();
  const params = useParams();
  const channelId = parseInt(params.id as string);
  
  const channel = channels.find(c => c.id === channelId);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [articleLikes, setArticleLikes] = useState<Record<string, ArticleLikeData>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Check if user is following this channel (from localStorage)
  useEffect(() => {
    const followedChannels = JSON.parse(localStorage.getItem('followedChannels') || '[]');
    setIsFollowing(followedChannels.includes(channelId));
  }, [channelId]);

  // Fetch articles from the channel's RSS feed
  useEffect(() => {
    const fetchChannelArticles = async () => {
      setLoading(true);
      try {
        if (!channel) return;
        
        // Use RSS to JSON API to convert RSS feeds to JSON
        const encodedUrl = encodeURIComponent(channel.rssUrl);
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodedUrl}`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
          // Transform RSS items to our article format
          const transformedArticles: Article[] = data.items.slice(0, 20).map((item: any, idx: number) => ({
            id: `${channelId}-${idx}`,
            title: item.title,
            body: item.description || item.content || 'No description available',
            channelId: channelId,
            channelName: channel.name,
            sourceUrl: item.link,
            sourceName: channel.name,
            status: 'verified',
            publishedAt: item.pubDate || new Date().toISOString(),
            imageUrl: item.thumbnail || null,
            viewCount: Math.floor(Math.random() * 5000),
          }));
          setArticles(transformedArticles);
        }
      } catch (error) {
        console.error('Error fetching channel articles:', error);
        // Fallback to mock articles if RSS fetch fails
        if (channel) {
          setArticles(generateMockArticles(channel));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChannelArticles();
  }, [channel, channelId]);

  const generateMockArticles = (ch: typeof channel): Article[] => {
    if (!ch) return [];
    
    const mockTitles = [
      `${ch.name} Breaking News: Major Developments Unfold`,
      `${ch.name} Exclusive: Inside Story You Need to Know`,
      `${ch.name} Analysis: What This Means for You`,
      `${ch.name} Live Coverage: Events Happening Now`,
      `${ch.name} Investigation: Deep Dive into Recent Events`,
      `${ch.name} Feature: The Story Behind the Headlines`,
      `${ch.name} Update: Latest Information Available`,
      `${ch.name} Special Report: Comprehensive Coverage`,
    ];

    return mockTitles.map((title, idx) => ({
      id: `${channelId}-mock-${idx}`,
      title,
      body: 'Stay tuned for the latest updates from our newsroom. We bring you comprehensive coverage of the stories that matter most.',
      channelId: channelId,
      channelName: ch.name,
      sourceUrl: ch.website,
      sourceName: ch.name,
      status: 'verified',
      publishedAt: new Date(Date.now() - idx * 3600000).toISOString(),
      imageUrl: null,
      viewCount: Math.floor(Math.random() * 5000),
    }));
  };

  const handleFollowClick = () => {
    if (isFollowing) {
      setShowUnfollowConfirm(true);
    } else {
      const followedChannels = JSON.parse(localStorage.getItem('followedChannels') || '[]');
      followedChannels.push(channelId);
      localStorage.setItem('followedChannels', JSON.stringify(followedChannels));
      setIsFollowing(true);
    }
  };

  const handleUnfollowConfirm = (confirm: boolean) => {
    if (confirm) {
      const followedChannels = JSON.parse(localStorage.getItem('followedChannels') || '[]');
      const updatedChannels = followedChannels.filter((id: number) => id !== channelId);
      localStorage.setItem('followedChannels', JSON.stringify(updatedChannels));
      setIsFollowing(false);
    }
    setShowUnfollowConfirm(false);
  };

  const handleArticleLike = (articleId: string) => {
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
  };

  const getArticleLikeData = (articleId: string): ArticleLikeData => {
    return articleLikes[articleId] || { liked: false, count: Math.floor(Math.random() * 200) };
  };

  const getTotalEngagement = (articleId: string): number => {
    const likeData = getArticleLikeData(articleId);
    return likeData.count;
  };

  const getCommentCount = (articleId: string): number => {
    return commentCounts[articleId] || 0;
  };

  const handleCommentAdded = (articleId: string) => {
    setCommentCounts(prev => ({
      ...prev,
      [articleId]: (prev[articleId] || 0) + 1,
    }));
  };

  const formatDate = (dateString: string): string => {
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

  if (!channel) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#2C3E50' }}>
            Channel Not Found
          </h1>
          <Link href="/home" className="text-[#00B4A0] font-bold hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0">
            <Image src="/logo.png" alt="WCNA Logo" width={48} height={48} className="rounded" />
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#2C3E50' }}>WCNA</span>
          </Link>
          <button
            onClick={() => {
              logoutUser('/');
            }}
            className="px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: '#E74C3C' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Channel Header */}
      <div className="border-b" style={{ borderColor: '#E0E6ED', backgroundColor: '#F5F7FA' }}>
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <div className="flex items-start justify-between gap-4 lg:gap-6 flex-col lg:flex-row">
            <div className="flex items-start gap-4 lg:gap-6 w-full lg:w-auto">
              {/* Channel Avatar */}
              <div
                className="w-16 lg:w-24 h-16 lg:h-24 rounded-full flex items-center justify-center border-4 flex-shrink-0 overflow-hidden"
                style={{ borderColor: '#00B4A0', backgroundColor: '#FFFFFF' }}
              >
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Channel Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>
                  {channel.name}
                </h1>
                <p className="text-sm lg:text-lg mb-4" style={{ color: '#7F8C8D' }}>
                  {channel.description}
                </p>
                <a
                  href={channel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs lg:text-sm font-bold hover:underline inline-block"
                  style={{ color: '#00B4A0' }}
                >
                  Visit Official Website →
                </a>
              </div>
            </div>

            {/* Follow Button */}
            <div className="w-full lg:w-auto flex-shrink-0">
              <button
                onClick={handleFollowClick}
                className="w-full lg:w-auto px-6 py-3 rounded-lg font-bold text-white transition-all hover:shadow-lg"
                style={{
                  backgroundColor: isFollowing ? '#00B4A0' : '#00B4A0',
                  opacity: isFollowing ? 1 : 1,
                }}
              >
                {isFollowing ? '✓ Following' : '+ Follow'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        {/* Section Title */}
        <h2 className="text-xl lg:text-2xl font-bold mb-8" style={{ color: '#2C3E50' }}>
          Latest from {channel.name}
        </h2>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p style={{ color: '#7F8C8D' }}>Loading articles from {channel.name}...</p>
          </div>
        )}

        {/* Articles Feed */}
        {!loading && articles.length > 0 && (
          <div className="space-y-6">
            {articles.map((article) => {
              const likeData = getArticleLikeData(article.id);
              const commentCount = getCommentCount(article.id);
              return (
                <article
                  key={article.id}
                  className="rounded-lg border p-4 lg:p-6 hover:shadow-md transition-shadow bg-white"
                  style={{ borderColor: '#E0E6ED' }}
                >
                  <div className="flex items-start gap-4 lg:gap-6 flex-col lg:flex-row">
                    {/* Article Image */}
                    {article.imageUrl && (
                      <div className="w-full lg:w-48 h-32 lg:h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <Link
                          href={`/article/${article.id}`}
                          className="text-lg lg:text-xl font-bold hover:text-[#00B4A0] transition-colors"
                          style={{ color: '#2C3E50' }}
                        >
                          {article.title}
                        </Link>
                      </div>

                      <p className="text-sm lg:text-base mb-4 line-clamp-2" style={{ color: '#7F8C8D' }}>
                        {article.body}
                      </p>

                      {/* Article Meta */}
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                        <div className="flex items-center gap-2 text-xs lg:text-sm" style={{ color: '#95A5A6' }}>
                          <span>{article.sourceName}</span>
                          <span>•</span>
                          <span>{formatDate(article.publishedAt)}</span>
                          <span>•</span>
                          <span>{article.viewCount.toLocaleString()} views</span>
                        </div>
                      </div>

                      {/* Engagement Buttons */}
                      <div className="flex items-center gap-4 lg:gap-6">
                        <button
                          onClick={() => handleArticleLike(article.id)}
                          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[#E74C3C]"
                          style={{ color: likeData.liked ? '#E74C3C' : '#95A5A6' }}
                        >
                          <HeartIcon size={20} />
                          <span>{likeData.count}</span>
                        </button>

                        <button
                          onClick={() => setExpandedComments(prev => ({
                            ...prev,
                            [article.id]: !prev[article.id]
                          }))}
                          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[#00B4A0]"
                          style={{ color: '#95A5A6' }}
                        >
                          <MessageCircleIcon size={20} />
                          <span>{commentCount}</span>
                        </button>

                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[#00B4A0]"
                          style={{ color: '#95A5A6' }}
                        >
                          <LinkChainIcon size={20} />
                          <span>Read</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Comment Section */}
                  {expandedComments[article.id] && (
                    <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E0E6ED' }}>
                      <CommentSection
                        articleId={article.id}
                        articleTitle={article.title}
                        onCommentAdded={() => handleCommentAdded(article.id)}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: '#7F8C8D' }}>No articles available from {channel.name}</p>
          </div>
        )}
      </main>

      {/* Unfollow Confirmation Modal */}
      {showUnfollowConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>
              Unfollow {channel.name}?
            </h3>
            <p className="mb-6" style={{ color: '#7F8C8D' }}>
              You will no longer receive updates from this channel.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleUnfollowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: '#E0E6ED', color: '#2C3E50' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnfollowConfirm(true)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: '#E74C3C' }}
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
