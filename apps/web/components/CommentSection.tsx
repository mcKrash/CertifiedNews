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
  isReplyOpen?: boolean;
}

interface CommentSectionProps {
  articleId: string;
  articleTitle: string;
  onCommentAdded?: (comment: Comment) => void;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

export default function CommentSection({ articleId, articleTitle, onCommentAdded, isExpanded = false, onToggleExpand }: CommentSectionProps) {
  const [isOpen, setIsOpen] = useState(isExpanded);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'sample-1',
      userId: 'user-sample-1',
      userName: 'Alex Johnson',
      userAvatar: '👨',
      content: 'Great article! This really helped me understand the topic better.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 12,
      replies: [
        {
          id: 'reply-1',
          userId: 'user-sample-2',
          userName: 'Sarah Smith',
          userAvatar: '👩',
          content: 'I agree! The analysis was thorough and well-researched.',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          likes: 5,
          replies: [],
          isLiked: false,
        },
      ],
      isLiked: false,
    },
    {
      id: 'sample-2',
      userId: 'user-sample-3',
      userName: 'Mike Chen',
      userAvatar: '👨',
      content: 'Would love to see more articles on this topic. Very informative!',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      likes: 8,
      replies: [],
      isLiked: false,
    },
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState('user-' + Math.random().toString(36).substr(2, 9));
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBanStatus, setUserBanStatus] = useState<any>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [replyCharacterCount, setReplyCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if user is banned on component mount
  useEffect(() => {
    const banStatus = isUserBanned(currentUserId);
    setUserBanStatus(banStatus);
  }, [currentUserId]);

  // Sync external expand state
  useEffect(() => {
    setIsOpen(isExpanded);
  }, [isExpanded]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);
    setCharacterCount(text.length);
    setViolationMessage('');
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setReplyContent(text);
    setReplyCharacterCount(text.length);
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

    if (userBanStatus?.isBanned) {
      setViolationMessage(userBanStatus.reason);
      return;
    }

    const violation = checkContentViolation(newComment);
    
    if (violation.isViolating) {
      setViolationMessage(violation.reason || 'Your comment violates our Community Guidelines.');
      const enforcement = recordViolation(currentUserId, violation.severity);
      
      if (enforcement.shouldBan) {
        const banStatus = isUserBanned(currentUserId);
        setUserBanStatus(banStatus);
      }

      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

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

  const handleSubmitReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      setViolationMessage('Please write a reply before submitting.');
      return;
    }

    if (replyContent.length > 2000) {
      setViolationMessage('Reply exceeds maximum length of 2000 characters.');
      return;
    }

    if (userBanStatus?.isBanned) {
      setViolationMessage(userBanStatus.reason);
      return;
    }

    const violation = checkContentViolation(replyContent);
    
    if (violation.isViolating) {
      setViolationMessage(violation.reason || 'Your reply violates our Community Guidelines.');
      const enforcement = recordViolation(currentUserId, violation.severity);
      
      if (enforcement.shouldBan) {
        const banStatus = isUserBanned(currentUserId);
        setUserBanStatus(banStatus);
      }

      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const reply: Comment = {
      id: 'reply-' + Date.now(),
      userId: currentUserId,
      userName: 'You',
      userAvatar: '👤',
      content: replyContent,
      timestamp: new Date(),
      likes: 0,
      replies: [],
      isLiked: false,
    };

    setComments(comments.map(comment => {
      if (comment.id === parentCommentId) {
        return {
          ...comment,
          replies: [reply, ...comment.replies],
        };
      }
      return comment;
    }));

    setReplyContent('');
    setReplyCharacterCount(0);
    setReplyingTo(null);
    setViolationMessage('');
    setIsSubmitting(false);
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

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggleExpand) {
      onToggleExpand(newState);
    }
  };

  const renderCommentThread = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-8 lg:ml-12 border-l-2 pl-4' : ''}`} style={isReply ? { borderColor: '#E0E6ED' } : {}}>
      <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm lg:text-lg flex-shrink-0">
        {comment.userAvatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg p-3 lg:p-4" style={{ borderColor: '#E0E6ED' }}>
          <div className="flex items-center justify-between mb-2 flex-col sm:flex-row gap-1">
            <div>
              <p className="font-bold text-sm" style={{ color: '#2C3E50' }}>
                {comment.userName}
              </p>
              <p className="text-xs" style={{ color: '#95A5A6' }}>
                {formatDate(comment.timestamp)}
              </p>
            </div>
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
            <span>{comment.isLiked ? '❤️' : '👍'}</span>
            {comment.likes}
          </button>
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="hover:text-[#00B4A0] transition-colors"
          >
            {replyingTo === comment.id ? '✕ Cancel' : '💬 Reply'}
          </button>
        </div>

        {/* Reply Input */}
        {replyingTo === comment.id && (
          <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                👤
              </div>
              <div className="flex-1">
                <textarea
                  ref={replyTextareaRef}
                  value={replyContent}
                  onChange={handleReplyChange}
                  placeholder="Write a reply..."
                  className="w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                  style={{ borderColor: '#E0E6ED', '--tw-ring-color': '#00B4A0' } as any}
                  rows={2}
                  disabled={isSubmitting}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs" style={{ color: '#95A5A6' }}>
                    {replyCharacterCount} / 2000
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyContent.trim()}
                    className="px-4 py-1.5 rounded-lg font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#00B4A0' }}
                  >
                    {isSubmitting ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => renderCommentThread(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Premium Comment Button - Visible by default */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="px-4 py-2 rounded-full font-bold text-white transition-all hover:shadow-lg flex items-center gap-2 text-sm"
          style={{ backgroundColor: '#00B4A0' }}
        >
          <span>💬</span>
          <span>Comments ({comments.length})</span>
          <span>▼</span>
        </button>
      )}

      {/* Comment Section - Hidden by default, expands on click */}
      {isOpen && (
        <div className="border-t pt-8 mt-8" style={{ borderColor: '#E0E6ED' }}>
          {/* Comments Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2C3E50' }}>
              <span>💬</span>
              <span>Comments</span>
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-bold">
                {comments.length}
              </span>
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowGuidelinesModal(true)}
                className="text-xs font-bold hover:underline"
                style={{ color: '#00B4A0' }}
              >
                Guidelines
              </button>
              <button
                onClick={handleToggle}
                className="text-2xl font-bold"
                style={{ color: '#95A5A6' }}
              >
                ✕
              </button>
            </div>
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
                    placeholder="Share your mind..."
                    className="w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ borderColor: '#E0E6ED', '--tw-ring-color': '#00B4A0' } as any}
                    rows={3}
                    disabled={isSubmitting}
                    maxLength={2000}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-lg hover:text-[#00B4A0]" title="Link">
                        🔗
                      </button>
                      <button type="button" className="text-lg hover:text-[#00B4A0]" title="Image">
                        🖼️
                      </button>
                      <button type="button" className="text-lg hover:text-[#00B4A0]" title="Emoji">
                        😊
                      </button>
                      <button type="button" className="text-lg hover:text-[#00B4A0]" title="More">
                        ⋯
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      className="px-6 py-2 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#00B4A0' }}
                    >
                      {isSubmitting ? 'Posting...' : 'Post'}
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

          {/* Sort Options */}
          <div className="flex items-center justify-between mb-6">
            <div></div>
            <button className="text-xs font-bold flex items-center gap-1" style={{ color: '#00B4A0' }}>
              ↕️ Most Recent
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: '#7F8C8D' }}>
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              comments.map(comment => renderCommentThread(comment))
            )}
          </div>
        </div>
      )}

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
    </>
  );
}
