'use client';

import { useState, useRef, useEffect } from 'react';
import { checkContentViolation, recordViolation, isUserBanned, COMMUNITY_GUIDELINES } from '@/lib/moderation';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: Comment[];
  isLiked: boolean;
}

interface CommentSectionProps {
  articleId: string;
  articleTitle: string;
  onCommentAdded?: (comment: Comment) => void;
}

export default function CommentSection({ articleId, articleTitle, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState('user-' + Math.random().toString(36).substr(2, 9));
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBanStatus, setUserBanStatus] = useState<any>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if user is banned on component mount
  useEffect(() => {
    const banStatus = isUserBanned(currentUserId);
    setUserBanStatus(banStatus);
  }, [currentUserId]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);
    setCharacterCount(text.length);
    setViolationMessage('');
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setViolationMessage('Please write a comment before submitting.');
      return;
    }

    if (newComment.length > 2000) {
      setViolationMessage('Comment exceeds maximum length of 2000 characters.');
      return;
    }

    // Check if user is banned
    if (userBanStatus?.isBanned) {
      setViolationMessage(userBanStatus.reason);
      return;
    }

    // Check for content violations
    const violation = checkContentViolation(newComment);
    
    if (violation.isViolating) {
      setViolationMessage(violation.reason || 'Your comment violates our Community Guidelines.');
      
      // Record violation
      const enforcement = recordViolation(currentUserId, violation.severity);
      
      if (enforcement.shouldBan) {
        const banStatus = isUserBanned(currentUserId);
        setUserBanStatus(banStatus);
      }

      return;
    }

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create new comment
    const comment: Comment = {
      id: 'comment-' + Date.now(),
      userId: currentUserId,
      userName: 'You',
      userAvatar: '👤',
      content: newComment,
      timestamp: new Date(),
      likes: 0,
      replies: [],
      isLiked: false,
    };

    setComments([comment, ...comments]);
    setNewComment('');
    setCharacterCount(0);
    setViolationMessage('');
    setIsSubmitting(false);

    if (onCommentAdded) {
      onCommentAdded(comment);
    }
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return comment;
    }));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="border-t pt-8 mt-8" style={{ borderColor: '#E0E6ED' }}>
      {/* Comments Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold" style={{ color: '#2C3E50' }}>
          Comments ({comments.length})
        </h3>
        <button
          onClick={() => setShowGuidelinesModal(true)}
          className="text-xs font-bold hover:underline"
          style={{ color: '#00B4A0' }}
        >
          Community Guidelines
        </button>
      </div>

      {/* Ban Notice */}
      {userBanStatus?.isBanned && (
        <div
          className="p-4 rounded-lg mb-6 border-l-4"
          style={{ backgroundColor: '#FFF5F5', borderColor: '#E74C3C' }}
        >
          <p className="text-sm font-bold" style={{ color: '#E74C3C' }}>
            ⛔ {userBanStatus.reason}
          </p>
          {userBanStatus.unbanDate && (
            <p className="text-xs mt-2" style={{ color: '#C0392B' }}>
              You can comment again on {userBanStatus.unbanDate.toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Comment Input Box */}
      {!userBanStatus?.isBanned && (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
              👤
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Share your thoughts on this article... (Be respectful and follow our Community Guidelines)"
                className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ borderColor: '#E0E6ED', '--tw-ring-color': '#00B4A0' } as any}
                rows={3}
                disabled={isSubmitting}
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs" style={{ color: '#95A5A6' }}>
                  {characterCount} / 2000 characters
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-6 py-2 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#00B4A0' }}
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>

          {/* Violation Message */}
          {violationMessage && (
            <div
              className="p-3 rounded-lg text-sm border-l-4 mb-4"
              style={{ backgroundColor: '#FFF3CD', borderColor: '#FFC107', color: '#856404' }}
            >
              <p className="font-bold">⚠️ {violationMessage}</p>
            </div>
          )}
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: '#7F8C8D' }}>
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                {comment.userAvatar}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-4" style={{ borderColor: '#E0E6ED' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm" style={{ color: '#2C3E50' }}>
                      {comment.userName}
                    </p>
                    <p className="text-xs" style={{ color: '#95A5A6' }}>
                      {formatDate(comment.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#2C3E50' }}>
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs font-bold" style={{ color: '#95A5A6' }}>
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className="hover:text-[#00B4A0] transition-colors flex items-center gap-1"
                  >
                    <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                    {comment.likes}
                  </button>
                  <button className="hover:text-[#00B4A0] transition-colors">
                    💬 Reply
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-lg">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between" style={{ borderColor: '#E0E6ED' }}>
              <h2 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
                Community Guidelines
              </h2>
              <button
                onClick={() => setShowGuidelinesModal(false)}
                className="text-2xl font-bold"
                style={{ color: '#95A5A6' }}
              >
                ✕
              </button>
            </div>
            <div className="p-6 prose prose-sm max-w-none" style={{ color: '#2C3E50' }}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {COMMUNITY_GUIDELINES}
              </div>
            </div>
            <div className="border-t p-6 flex justify-end gap-3" style={{ borderColor: '#E0E6ED' }}>
              <button
                onClick={() => setShowGuidelinesModal(false)}
                className="px-6 py-2 rounded-lg font-bold"
                style={{ backgroundColor: '#F5F7FA', color: '#2C3E50' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
