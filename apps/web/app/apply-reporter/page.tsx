'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken, getCurrentUser } from '@/lib/auth';

interface ApplicationStatus {
  id: string;
  status: string;
  bio: string;
  experience: string;
  portfolio: string;
  reason: string;
  submittedAt: string;
  reviewedAt: string;
  reviewNotes: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ApplyReporterPage() {
  const [user, setUser] = useState(getCurrentUser());
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    bio: '',
    experience: '',
    portfolio: '',
    reason: '',
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/';
      return;
    }

    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/reporter-applications/my-application`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.data) {
        setApplicationStatus(data.data);
      }
    } catch (err) {
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const response = await fetch(`${API_URL}/reporter-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess('Application submitted successfully! We will review it and get back to you soon.');
      setApplicationStatus(data.data);
      setFormData({ bio: '', experience: '', portfolio: '', reason: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Loading...</p>
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
          <h1 className="text-3xl font-bold">Become a Reporter</h1>
          <p className="text-gray-600 mt-2">
            Join our network of certified news reporters and contribute to verified journalism.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Application Status */}
        {applicationStatus && (
          <div className="mb-8 p-6 rounded-lg border-l-4" style={{ borderLeftColor: '#17A2B8', backgroundColor: '#E7F3F7' }}>
            <h2 className="text-lg font-bold mb-2">Application Status</h2>
            <p className="mb-2">
              <strong>Status:</strong>{' '}
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{
                  backgroundColor:
                    applicationStatus.status === 'APPROVED'
                      ? '#D4EDDA'
                      : applicationStatus.status === 'REJECTED'
                      ? '#F8D7DA'
                      : '#FFF3CD',
                  color:
                    applicationStatus.status === 'APPROVED'
                      ? '#155724'
                      : applicationStatus.status === 'REJECTED'
                      ? '#721C24'
                      : '#856404',
                }}
              >
                {applicationStatus.status}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Submitted on {new Date(applicationStatus.submittedAt).toLocaleDateString()}
            </p>
            {applicationStatus.reviewNotes && (
              <p className="mt-3 text-sm">
                <strong>Review Notes:</strong> {applicationStatus.reviewNotes}
              </p>
            )}
          </div>
        )}

        {/* Application Form */}
        {!applicationStatus || applicationStatus.status === 'REJECTED' ? (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Application Form</h2>

            {error && (
              <div className="mb-6 p-4 rounded-lg text-red-600" style={{ backgroundColor: '#FFE5E5' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg text-green-600" style={{ backgroundColor: '#E5FFE5' }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself and your journalism background..."
                  className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={4}
                  required
                />
              </div>

              {/* Experience */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Journalism Experience
                </label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Describe your experience in journalism, media, or news reporting..."
                  className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={4}
                  required
                />
              </div>

              {/* Portfolio */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Portfolio / Previous Work
                </label>
                <input
                  type="url"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleInputChange}
                  placeholder="Link to your portfolio, blog, or previous published work..."
                  className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Why do you want to become a WCNA Reporter?
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Tell us why you're interested in joining WCNA as a certified reporter..."
                  className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={4}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        ) : applicationStatus.status === 'APPROVED' ? (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Congratulations!
              </h2>
              <p className="text-gray-600 mb-6">
                Your reporter application has been approved. You can now publish articles and contribute to WCNA.
              </p>
              <Link
                href="/home"
                className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700"
              >
                Go to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-yellow-600 mb-2">
                Application Under Review
              </h2>
              <p className="text-gray-600">
                Your application is being reviewed by our team. We'll notify you once a decision is made.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
