'use client';

import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Eye } from 'lucide-react';

interface EngagementBarProps {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  views?: number;
  liked: boolean;
  bookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
}

export default function EngagementBar({
  likes,
  comments,
  shares,
  bookmarks,
  views,
  liked,
  bookmarked,
  onLike,
  onComment,
  onShare,
  onBookmark,
}: EngagementBarProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-t border-gray-200 text-gray-600">
      {/* Like Button */}
      <button
        onClick={onLike}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-red-50 ${
          liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
        }`}
      >
        <Heart
          size={18}
          fill={liked ? 'currentColor' : 'none'}
          className="transition-colors"
        />
        <span className="text-sm font-medium">{likes}</span>
      </button>

      {/* Comment Button */}
      <button
        onClick={onComment}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-teal-500 hover:bg-teal-50 transition-all"
      >
        <MessageCircle size={18} />
        <span className="text-sm font-medium">{comments}</span>
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-all"
      >
        <Share2 size={18} />
        <span className="text-sm font-medium">{shares}</span>
      </button>

      {/* Bookmark Button */}
      <button
        onClick={onBookmark}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          bookmarked
            ? 'text-amber-500 hover:bg-amber-50'
            : 'text-gray-600 hover:text-amber-500 hover:bg-amber-50'
        }`}
      >
        <Bookmark
          size={18}
          fill={bookmarked ? 'currentColor' : 'none'}
          className="transition-colors"
        />
        <span className="text-sm font-medium">{bookmarks}</span>
      </button>

      {/* Views (Optional) */}
      {views !== undefined && (
        <div className="flex items-center gap-2 px-3 py-2 text-gray-500 text-sm">
          <Eye size={18} />
          <span>{views}</span>
        </div>
      )}
    </div>
  );
}
