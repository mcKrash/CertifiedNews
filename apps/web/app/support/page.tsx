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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedTickets = localStorage.getItem('wcna_support_tickets');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setEmail(parsedUser.email || '');
    }

    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    }
  }, []);

  const recentTickets = useMemo(() => tickets.slice(0, 5), [tickets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !subject.trim() || !description.trim()) {
      setErrorMessage('Please complete your email, subject, and issue details before submitting.');
      return;
    }

    const moderationCheck = checkContentViolation(`${subject}\n${description}`);
    if (moderationCheck.isViolating) {
      setErrorMessage(moderationCheck.reason || 'Your message could not be submitted because it violates platform guidelines.');
      return;
    }

    const newTicket: SupportTicket = {
      id: `WCNA-${Date.now().toString().slice(-6)}`,
      category,
      priority,
      subject: subject.trim(),
      description: description.trim(),
      email: email.trim(),
      articleUrl: articleUrl.trim(),
      status: priority === 'urgent' ? 'In Review' : 'Open',
      createdAt: new Date().toISOString(),
    };

    const updatedTickets = [newTicket, ...tickets];
    localStorage.setItem('wcna_support_tickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);
    setSubject('');
    setDescription('');
    setArticleUrl('');
    setPriority('normal');
    setCategory('technical_issue');
    setSuccessMessage(`Your issue has been submitted successfully. Reference: ${newTicket.id}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="WCNA Logo" width={48} height={48} className="rounded" />
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#2C3E50' }}>WCNA</span>
          </Link>
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white"
            style={{ backgroundColor: '#00B4A0' }}
          >
            Back to Feed
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border shadow-sm p-8 mb-8" style={{ borderColor: '#E0E6ED' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8F8F5' }}>
              <SupportIcon size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C3E50' }}>Contact Customer Care</h1>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: '#7F8C8D' }}>
                Use this page to report platform issues, account problems, moderation concerns, or verification questions. Every submission is screened against WCNA safety standards before it is recorded.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-8">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC' }}>
              <p className="font-bold mb-1" style={{ color: '#2C3E50' }}>Response Logic</p>
              <p style={{ color: '#7F8C8D' }}>Urgent and abuse-related issues are marked for immediate review.</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC' }}>
              <p className="font-bold mb-1" style={{ color: '#2C3E50' }}>Safety Screening</p>
              <p style={{ color: '#7F8C8D' }}>Messages containing harassment, hate speech, or spam are automatically blocked.</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC' }}>
              <p className="font-bold mb-1" style={{ color: '#2C3E50' }}>Ticket Tracking</p>
              <p style={{ color: '#7F8C8D' }}>Each issue receives a reference ID so it can be followed internally.</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#FDECEC', color: '#C0392B' }}>
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#E8F8F5', color: '#00B4A0' }}>
              {successMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Contact email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none"
                  style={{ borderColor: '#E0E6ED' }}
                  placeholder="you@wcna.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Issue category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none"
                  style={{ borderColor: '#E0E6ED' }}
                >
                  {ISSUE_CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Priority level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none"
                  style={{ borderColor: '#E0E6ED' }}
                >
                  {PRIORITIES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Related article or page URL</label>
                <input
                  type="text"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none"
                  style={{ borderColor: '#E0E6ED' }}
                  placeholder="Optional reference link"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none"
                style={{ borderColor: '#E0E6ED' }}
                placeholder="Summarize the issue clearly"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Issue details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={7}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none"
                style={{ borderColor: '#E0E6ED' }}
                placeholder="Describe what happened, what page was affected, and what outcome you expect."
              />
            </div>

            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
              <p className="text-xs" style={{ color: '#7F8C8D' }}>
                Submissions are stored locally for this demo and aligned with WCNA moderation rules.
              </p>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: '#00B4A0' }}
              >
                Submit Issue
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-8" style={{ borderColor: '#E0E6ED' }}>
          <h2 className="text-2xl font-bold mb-5" style={{ color: '#2C3E50' }}>Recent Support Requests</h2>
          {recentTickets.length === 0 ? (
            <p className="text-sm" style={{ color: '#7F8C8D' }}>
              No issues have been submitted from this browser yet.
            </p>
          ) : (
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border p-4" style={{ borderColor: '#E0E6ED' }}>
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#2C3E50' }}>{ticket.subject}</p>
                      <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>
                        {ticket.id} • {ticket.category.replace(/_/g, ' ')} • {new Date(ticket.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#E8F8F5', color: '#00B4A0' }}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
