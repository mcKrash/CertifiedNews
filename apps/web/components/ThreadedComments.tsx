'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Trash2, Edit2, Loader2 } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  userType: string;
  isVerified: boolean;
}

interface Reply {
  id: string;
  content: string;
  author: Author;
  likes: number;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  author: Author;
  likes: number;
  replies: Reply[];
  createdAt: string;
}

interface ThreadedCommentsProps {
  postId: string;
  comments: Comment[];
  onAddComment: (content: string, parentCommentId?: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
  currentUserId?: string;
  isLoading?: boolean;
}

export default function ThreadedComments({
  postId,
  comments,
  onAddComment,
  onDeleteComment,
  onLikeComment,
  currentUserId,
  isLoading,
}: ThreadedCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(replyContent, parentCommentId);
      setReplyContent('');
      setReplyingTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* New Comment Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-3">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId || 'guest'}`}
            alt="Your avatar"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setNewComment('')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-teal-500" size={32} />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="space-y-3">
              {/* Main Comment */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-3">
                  <img
                    src={
                      comment.author.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.username}`
                    }
                    alt={comment.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {comment.author.name}
                      </span>
                      <span className="text-gray-500 text-sm">
                        @{comment.author.username}
                      </span>
                      {comment.author.isVerified && (
                        <span className="text-teal-500 text-xs">✓</span>
                      )}
                      <span className="text-gray-400 text-sm">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-2">{comment.content}</p>

                    {/* Comment Actions */}
                    <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
                      <button
                        onClick={() => onLikeComment(comment.id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart size={16} />
                        {comment.likes}
                      </button>
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="flex items-center gap-1 hover:text-teal-500 transition-colors"
                      >
                        <MessageCircle size={16} />
                        Reply
                      </button>
                      {currentUserId === comment.author.id && (
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reply Input */}
              {replyingTo === comment.id && (
                <div className="ml-12 bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId || 'guest'}`}
                      alt="Your avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <textarea
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        placeholder={`Reply to @${comment.author.username}...`}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddReply(comment.id)}
                          disabled={!replyContent.trim() || submitting}
                          className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
                        >
                          {submitting && (
                            <Loader2 size={14} className="animate-spin" />
                          )}
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-12 space-y-3">
                  {comment.replies.map(reply => (
                    <div
                      key={reply.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex gap-2">
                        <img
                          src={
                            reply.author.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author.username}`
                          }
                          alt={reply.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {reply.author.name}
                            </span>
                            <span className="text-gray-500 text-xs">
                              @{reply.author.username}
                            </span>
                            {reply.author.isVerified && (
                              <span className="text-teal-500 text-xs">✓</span>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm mt-1">
                            {reply.content}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-gray-500 text-xs">
                            <button className="hover:text-red-500 transition-colors">
                              ♥ {reply.likes}
                            </button>
                            <span>
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
