'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken, getCurrentUser } from '@/lib/auth';

interface ReporterApplication {
  id: string;
  userId: string;
  status: string;
  bio: string;
  experience: string;
  portfolio: string;
  reason: string;
  submittedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
}

interface AdminStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminDashboard() {
  const user = getCurrentUser();
  const [applications, setApplications] = useState<ReporterApplication[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedApp, setSelectedApp] = useState<ReporterApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token || user?.role !== 'ADMIN') {
      window.location.href = '/home';
      return;
    }

    fetchApplications();
  }, [user, filter]);

  const fetchApplications = async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${API_URL}/reporter-applications?status=${filter}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setApplications(data.data);
        updateStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (apps: ReporterApplication[]) => {
    const allApps = apps;
    setStats({
      totalApplications: allApps.length,
      pendingApplications: allApps.filter((a) => a.status === 'PENDING').length,
      approvedApplications: allApps.filter((a) => a.status === 'APPROVED').length,
      rejectedApplications: allApps.filter((a) => a.status === 'REJECTED').length,
    });
  };

  const handleReview = async (applicationId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewing(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/reporter-applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        setSelectedApp(null);
        setReviewNotes('');
        fetchApplications();
      }
    } catch (err) {
      console.error('Error reviewing application:', err);
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/home" className="text-teal-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage reporter applications and platform moderation</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm font-semibold">Total Applications</p>
            <p className="text-3xl font-bold mt-2">{stats.totalApplications}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-semibold">Pending</p>
            <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.pendingApplications}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-semibold">Approved</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{stats.approvedApplications}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-semibold">Rejected</p>
            <p className="text-3xl font-bold mt-2 text-red-600">{stats.rejectedApplications}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                filter === status
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Applicant</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Submitted</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{app.user.name}</td>
                      <td className="px-6 py-4 text-gray-600">{app.user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor:
                              app.status === 'APPROVED'
                                ? '#D4EDDA'
                                : app.status === 'REJECTED'
                                ? '#F8D7DA'
                                : '#FFF3CD',
                            color:
                              app.status === 'APPROVED'
                                ? '#155724'
                                : app.status === 'REJECTED'
                                ? '#721C24'
                                : '#856404',
                          }}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-teal-600 hover:underline font-semibold"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No applications found for this filter.
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Review Application</h2>
              <p className="text-gray-600 mt-1">{selectedApp.user.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-gray-700 text-sm">{selectedApp.bio}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Experience</h3>
                <p className="text-gray-700 text-sm">{selectedApp.experience}</p>
              </div>

              {selectedApp.portfolio && (
                <div>
                  <h3 className="font-semibold mb-2">Portfolio</h3>
                  <a
                    href={selectedApp.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:underline text-sm"
                  >
                    {selectedApp.portfolio}
                  </a>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Reason</h3>
                <p className="text-gray-700 text-sm">{selectedApp.reason}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes for the applicant..."
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end sticky bottom-0">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 border rounded-lg font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedApp.id, 'REJECTED')}
                disabled={reviewing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {reviewing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleReview(selectedApp.id, 'APPROVED')}
                disabled={reviewing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {reviewing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
