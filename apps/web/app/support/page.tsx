'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkContentViolation } from '@/lib/moderation';
import { SupportIcon } from '@/lib/icons';

interface SupportTicket {
  id: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  email: string;
  articleUrl: string;
  status: 'Open' | 'In Review';
  createdAt: string;
}

const ISSUE_CATEGORIES = [
  { value: 'technical_issue', label: 'Technical issue' },
  { value: 'account_access', label: 'Account access' },
  { value: 'content_moderation', label: 'Content moderation' },
  { value: 'verification_question', label: 'Verification question' },
  { value: 'abuse_report', label: 'Abuse report' },
  { value: 'feature_request', label: 'Feature request' },
];

const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function SupportPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('technical_issue');
  const [priority, setPriority] = useState('normal');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setEmail(parsedUser.email || '');
    }
  }, []);

  const recentTickets = useMemo(() => tickets.slice(0, 5), [tickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    if (!email || !subject.trim() || !description.trim()) {
      setErrorMessage('Please complete your email, subject, and issue details before submitting.');
      setSubmitting(false);
      return;
    }

    const moderationCheck = checkContentViolation(`${subject}\n${description}`);
    if (moderationCheck.isViolating) {
      setErrorMessage(moderationCheck.reason || 'Your message could not be submitted because it violates platform guidelines.');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const res = await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          category,
          priority,
          subject: subject.trim(),
          description: description.trim(),
          email: email.trim(),
          articleUrl: articleUrl.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        setErrorMessage(error.message || 'Failed to submit support ticket');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setSuccessMessage('Support ticket submitted successfully. We will review it shortly.');
      setSubject('');
      setDescription('');
      setArticleUrl('');
      setPriority('normal');
      setCategory('technical_issue');
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      setErrorMessage('Failed to submit support ticket. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="WCNA Logo" width={48} height={48} className="rounded" />
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#2C3E50' }}>WCNA</span>
          </Link>
          <Link href="/home" className="text-sm font-semibold" style={{ color: '#00B4A0' }}>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Form */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border p-6 bg-white" style={{ borderColor: '#E0E6ED' }}>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C3E50' }}>
                Contact Support
              </h1>
              <p className="mb-6" style={{ color: '#7F8C8D' }}>
                Have an issue? Let us know and we'll help you resolve it as quickly as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4A0')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E6ED')}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Issue Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4A0')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E6ED')}
                  >
                    {ISSUE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4A0')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E6ED')}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4A0')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E6ED')}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide detailed information about your issue..."
                    rows={5}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
                    style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4A0')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E6ED')}
                  />
                </div>

                {/* Article URL (Optional) */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Related Article URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4A0')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E6ED')}
                  />
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-3 rounded-md text-red-600 text-sm" style={{ backgroundColor: '#FFE5E5' }}>
                    {errorMessage}
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="p-3 rounded-md text-green-600 text-sm" style={{ backgroundColor: '#E8F8F5' }}>
                    {successMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-md font-semibold text-white transition-opacity"
                  style={{
                    backgroundColor: '#00B4A0',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>
          </div>

          {/* FAQ / Info Section */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border p-6 bg-white" style={{ borderColor: '#E0E6ED' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#2C3E50' }}>
                Quick Help
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Response Time
                  </h3>
                  <p style={{ color: '#7F8C8D', fontSize: '14px' }}>
                    We typically respond to support tickets within 24-48 hours.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Urgent Issues
                  </h3>
                  <p style={{ color: '#7F8C8D', fontSize: '14px' }}>
                    Mark your ticket as "Urgent" for priority handling.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: '#2C3E50' }}>
                    Account Access
                  </h3>
                  <p style={{ color: '#7F8C8D', fontSize: '14px' }}>
                    If you cannot log in, select "Account access" as your category.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
