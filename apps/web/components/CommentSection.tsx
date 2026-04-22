'use client';

import { useEffect, useMemo, useState } from 'react';
import { checkContentViolation, recordViolation, isUserBanned, COMMUNITY_GUIDELINES } from '@/lib/moderation';
import { CloseIcon, ReplyIcon, ImageIcon, EmojiIcon, MoreIcon, SortIcon, ChatBubbleIcon, HeartIcon, LinkIcon } from '@/lib/icons';
import { getCurrentUser, getToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';

interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  username?: string;
  userAvatar: string | null;
  content: string;
  createdAt: string;
  likes: number;
  replies: CommentItem[];
}

interface CommentSectionProps {
  articleId?: string;
  postId?: string;
  articleTitle?: string;
  onCommentAdded?: (comment: CommentItem) => void;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

export default function CommentSection({ articleId, postId, onCommentAdded, isExpanded = false, onToggleExpand }: CommentSectionProps) {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [isOpen, setIsOpen] = useState(isExpanded);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userBanStatus, setUserBanStatus] = useState<any>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [replyCharacterCount, setReplyCharacterCount] = useState(0);

  useEffect(() => {
    setUserBanStatus(isUserBanned(currentUser?.id || 'guest'));
  }, [currentUser?.id]);

  useEffect(() => {
    setIsOpen(isExpanded);
  }, [isExpanded]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const query = articleId ? `articleId=${encodeURIComponent(articleId)}` : `postId=${encodeURIComponent(postId || '')}`;
        const response = await fetch(`${API_URL}/comments?${query}&page=1&limit=20`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load comments');
        }
        setComments(data.data || []);
      } catch (error: any) {
        setViolationMessage(error.message || 'Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [articleId, postId, isOpen]);

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

  const submitCommentToApi = async (content: string, parentId?: string) => {
    const token = getToken();
    if (!token) {
      throw new Error('Please sign in to comment.');
    }

    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content,
        articleId,
        postId,
        parentId: parentId || null,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to post comment');
    }

    return data.data as CommentItem;
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
      const enforcement = recordViolation(currentUser?.id || 'guest', violation.severity);
      if (enforcement.shouldBan) {
        setUserBanStatus(isUserBanned(currentUser?.id || 'guest'));
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const comment = await submitCommentToApi(newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      setCharacterCount(0);
      setViolationMessage('');
      onCommentAdded?.(comment);
    } catch (error: any) {
      setViolationMessage(error.message || 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
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
      const enforcement = recordViolation(currentUser?.id || 'guest', violation.severity);
      if (enforcement.shouldBan) {
        setUserBanStatus(isUserBanned(currentUser?.id || 'guest'));
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const reply = await submitCommentToApi(replyContent.trim(), parentCommentId);
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentCommentId
            ? { ...comment, replies: [...comment.replies, reply] }
            : comment
        )
      );
      setReplyContent('');
      setReplyCharacterCount(0);
      setReplyingTo(null);
      setViolationMessage('');
    } catch (error: any) {
      setViolationMessage(error.message || 'Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
    onToggleExpand?.(newState);
  };

  const renderAvatar = (comment: CommentItem) => {
    if (comment.userAvatar) {
      return <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full rounded-full object-cover" />;
    }
    return <span>{comment.userName.charAt(0).toUpperCase()}</span>;
  };

  const renderCommentThread = (comment: CommentItem, isReply = false, depth = 0) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-8 lg:ml-12 border-l-2 pl-4' : ''}`} style={isReply ? { borderColor: '#E0E6ED' } : {}}>
      <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
        {renderAvatar(comment)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
          <div className="flex items-center justify-between mb-2 flex-col sm:flex-row gap-1">
            <div>
              <p className="font-bold text-sm" style={{ color: '#2C3E50' }}>{comment.userName}</p>
              <p className="text-xs" style={{ color: '#95A5A6' }}>
                {comment.username ? `@${comment.username} · ` : ''}{formatDate(comment.createdAt)}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#2C3E50' }}>{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs font-bold" style={{ color: '#95A5A6' }}>
          <span className="flex items-center gap-1"><HeartIcon size={16} /> {comment.likes}</span>
          {depth < 2 && (
            <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="hover:text-[#00B4A0] transition-colors flex items-center gap-1">
              <ReplyIcon size={16} />
              {replyingTo === comment.id ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>

        {replyingTo === comment.id && depth < 2 && (
          <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" /> : '👤'}
              </div>
              <div className="flex-1">
                <textarea value={replyContent} onChange={handleReplyChange} placeholder="Write a reply..." className="w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none" style={{ borderColor: '#E0E6ED', '--tw-ring-color': '#00B4A0' } as any} rows={2} disabled={isSubmitting} maxLength={2000} />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs" style={{ color: '#95A5A6' }}>{replyCharacterCount} / 2000</div>
                  <button type="submit" disabled={isSubmitting || !replyContent.trim()} className="px-4 py-1.5 rounded-lg font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#00B4A0' }}>
                    {isSubmitting ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {comment.replies?.length > 0 && depth < 2 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => renderCommentThread(reply, true, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="border-t pt-8 mt-8" style={{ borderColor: '#E0E6ED' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2C3E50' }}>
          <ChatBubbleIcon size={24} />
          <span>Comments</span>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-bold">{comments.length}</span>
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowGuidelinesModal(true)} className="text-xs font-bold hover:underline" style={{ color: '#00B4A0' }}>Guidelines</button>
          <button onClick={handleToggle} className="text-2xl font-bold" style={{ color: '#95A5A6' }}><CloseIcon size={24} /></button>
        </div>
      </div>

      {userBanStatus?.isBanned && (
        <div className="p-4 rounded-lg mb-6 border-l-4" style={{ backgroundColor: '#FFF5F5', borderColor: '#E74C3C' }}>
          <p className="text-sm font-bold" style={{ color: '#E74C3C' }}>⛔ {userBanStatus.reason}</p>
        </div>
      )}

      {!userBanStatus?.isBanned && (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
              {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" /> : '👤'}
            </div>
            <div className="flex-1">
              <textarea value={newComment} onChange={handleCommentChange} placeholder="Share your mind..." className="w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none" style={{ borderColor: '#E0E6ED', '--tw-ring-color': '#00B4A0' } as any} rows={3} disabled={isSubmitting} maxLength={2000} />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button type="button" className="hover:text-[#00B4A0] transition-colors" title="Link"><LinkIcon size={20} /></button>
                  <button type="button" className="hover:text-[#00B4A0] transition-colors" title="Image"><ImageIcon size={20} /></button>
                  <button type="button" className="hover:text-[#00B4A0] transition-colors" title="Emoji"><EmojiIcon size={20} /></button>
                  <button type="button" className="hover:text-[#00B4A0] transition-colors" title="More"><MoreIcon size={20} /></button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color: '#95A5A6' }}>{characterCount} / 2000</span>
                  <button type="submit" disabled={isSubmitting || !newComment.trim()} className="px-6 py-2 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#00B4A0' }}>
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {violationMessage && (
            <div className="p-3 rounded-lg text-sm border-l-4 mb-4" style={{ backgroundColor: '#FFF3CD', borderColor: '#FFC107', color: '#856404' }}>
              <p className="font-bold">⚠️ {violationMessage}</p>
            </div>
          )}
        </form>
      )}

      <div className="flex items-center justify-between mb-6">
        <div></div>
        <button className="text-xs font-bold flex items-center gap-2" style={{ color: '#00B4A0' }}>
          <SortIcon size={16} />
          Most Recent
        </button>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8"><p style={{ color: '#7F8C8D' }}>Loading comments...</p></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8"><p style={{ color: '#7F8C8D' }}>No comments yet. Be the first to share your thoughts.</p></div>
        ) : (
          comments.map((comment) => renderCommentThread(comment, false, 0))
        )}
      </div>

      {showGuidelinesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-lg">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: '#2C3E50' }}>Community Guidelines</h2>
              <button onClick={() => setShowGuidelinesModal(false)} className="text-gray-500 hover:text-gray-700"><CloseIcon size={24} /></button>
            </div>
            <div className="p-6">
              <div className="space-y-6 text-sm leading-relaxed" style={{ color: '#7F8C8D' }}>
                <div dangerouslySetInnerHTML={{ __html: COMMUNITY_GUIDELINES.replace(/^## /gm, '<h2 style="color: #2C3E50; font-size: 1.25rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem;">').replace(/^### /gm, '<h3 style="color: #2C3E50; font-weight: bold; margin-top: 0.75rem; margin-bottom: 0.25rem;">').replace(/\n/g, '</h3>\n') }} />
              </div>
              <button onClick={() => setShowGuidelinesModal(false)} className="w-full mt-8 py-3 rounded-lg font-bold text-white transition-all" style={{ backgroundColor: '#00B4A0' }}>
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
