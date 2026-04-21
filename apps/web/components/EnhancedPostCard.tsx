'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Bookmark, Link as LinkIcon, MoreHorizontal } from 'lucide-react';

interface EnhancedPostCardProps {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    userType: 'REGULAR_USER' | 'JOURNALIST' | 'AGENCY';
    isVerified: boolean;
  };
  content: string;
  images?: string[];
  links?: string[];
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  onLike: (postId: string) => Promise<void>;
  onBookmark: (postId: string) => Promise<void>;
  onShare: (postId: string) => Promise<void>;
}

export default function EnhancedPostCard({
  id,
  author,
  content,
  images = [],
  links = [],
  likes,
  comments,
  shares,
  liked,
  bookmarked,
  createdAt,
  onLike,
  onBookmark,
  onShare,
}: EnhancedPostCardProps) {
  const [liking, setLiking] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleLike = async () => {
    setLiking(true);
    try {
      await onLike(id);
    } finally {
      setLiking(false);
    }
  };

  const handleBookmark = async () => {
    setBookmarking(true);
    try {
      await onBookmark(id);
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await onShare(id);
    } finally {
      setSharing(false);
    }
  };

  const getVerificationBadge = () => {
    if (author.userType === 'REGULAR_USER') return null;

    if (author.isVerified) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          ✓ Verified {author.userType === 'JOURNALIST' ? 'Journalist' : 'Agency'}
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
        ⏳ Pending Verification
      </div>
    );
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border p-4 mb-4" style={{ borderColor: '#E0E6ED' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Link href={`/profile/${author.username}`}>
            <Image
              src={author.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${author.username}`}
              alt={author.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80"
            />
          </Link>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${author.username}`} className="font-semibold text-gray-800 hover:text-[#00B4A0]">
                {author.name}
              </Link>
              {getVerificationBadge()}
            </div>
            <div className="text-sm text-gray-500">
              @{author.username} · {formatDate(createdAt)}
            </div>
          </div>
        </div>

        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-3 text-gray-800 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>

      {/* Links Preview */}
      {links.length > 0 && (
        <div className="mb-3 space-y-2">
          {links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 transition"
              style={{ borderColor: '#E0E6ED' }}
            >
              <LinkIcon size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-[#00B4A0] truncate">{link}</span>
            </a>
          ))}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className={`mb-3 grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((image, index) => (
            <Image
              key={index}
              src={image}
              alt={`Post image ${index}`}
              width={400}
              height={300}
              className="w-full h-auto rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex gap-4 text-sm text-gray-500 mb-3 py-2 border-y" style={{ borderColor: '#E0E6ED' }}>
        <span className="hover:text-[#00B4A0] cursor-pointer">{likes} Likes</span>
        <span className="hover:text-[#00B4A0] cursor-pointer">{comments} Comments</span>
        <span className="hover:text-[#00B4A0] cursor-pointer">{shares} Shares</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between text-gray-500">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
            liked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          <span className="text-sm">Like</span>
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:text-[#00B4A0] hover:bg-[#00B4A0]/10 transition">
          <MessageCircle size={18} />
          <span className="text-sm">Comment</span>
        </button>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:text-[#00B4A0] hover:bg-[#00B4A0]/10 transition"
        >
          <Share2 size={18} />
          <span className="text-sm">Share</span>
        </button>

        <button
          onClick={handleBookmark}
          disabled={bookmarking}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
            bookmarked ? 'text-[#00B4A0] hover:text-[#009985]' : 'hover:text-[#00B4A0] hover:bg-[#00B4A0]/10'
          }`}
        >
          <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          <span className="text-sm">Save</span>
        </button>
      </div>
    </div>
  );
}
