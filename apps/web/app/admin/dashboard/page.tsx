'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingApplications: number;
  verifiedJournalists: number;
  verifiedAgencies: number;
  totalArticles: number;
  reportedContent: number;
}

interface RecentPost {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
  };
  createdAt: string;
}

interface RecentApplication {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentPosts: RecentPost[];
  recentApplications: RecentApplication[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Not authenticated');
          return;
        }

        const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-teal-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700">
          No data available
        </div>
      </div>
    );
  }

  const stats = data.stats;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/home" className="text-teal-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Platform overview and management tools
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-teal-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <Users className="text-teal-500" size={32} />
            </div>
          </div>

          {/* Total Posts */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Posts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalPosts.toLocaleString()}
                </p>
              </div>
              <FileText className="text-blue-500" size={32} />
            </div>
          </div>

          {/* Total Comments */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Comments
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalComments.toLocaleString()}
                </p>
              </div>
              <MessageSquare className="text-purple-500" size={32} />
            </div>
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Pending Applications
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pendingApplications}
                </p>
              </div>
              <AlertCircle className="text-orange-500" size={32} />
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Verified Journalists */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Verified Journalists</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.verifiedJournalists}
                </p>
              </div>
            </div>
          </div>

          {/* Verified Agencies */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Verified Agencies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.verifiedAgencies}
                </p>
              </div>
            </div>
          </div>

          {/* Total Articles */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-indigo-500" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalArticles}
                </p>
              </div>
            </div>
          </div>

          {/* Reported Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-red-500" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Reported Content</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.reportedContent}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Posts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Posts
            </h2>
            <div className="space-y-4">
              {data.recentPosts.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent posts</p>
              ) : (
                data.recentPosts.map(post => (
                  <div
                    key={post.id}
                    className="border-l-4 border-gray-200 pl-4 py-2 hover:border-teal-500 transition-colors"
                  >
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        By {post.author.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/admin/moderation">
              <button className="w-full mt-4 py-2 text-teal-500 hover:text-teal-600 font-medium text-sm flex items-center justify-center gap-2">
                View All Posts <ArrowRight size={16} />
              </button>
            </Link>
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pending Applications
            </h2>
            <div className="space-y-4">
              {data.recentApplications.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending applications</p>
              ) : (
                data.recentApplications.map(app => (
                  <div
                    key={app.id}
                    className="border-l-4 border-orange-200 pl-4 py-2 hover:border-orange-500 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {app.user.name}
                    </p>
                    <p className="text-xs text-gray-500">{app.user.email}</p>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/admin/applications">
              <button className="w-full mt-4 py-2 text-teal-500 hover:text-teal-600 font-medium text-sm flex items-center justify-center gap-2">
                View All Applications <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Users Management */}
          <Link href="/admin/users">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
              <Users className="text-teal-500 mb-3" size={28} />
              <h3 className="text-lg font-bold text-gray-900">User Management</h3>
              <p className="text-gray-600 text-sm mt-2">
                Manage users, verify accounts, and handle suspensions
              </p>
              <div className="mt-4 text-teal-500 hover:text-teal-600 font-medium text-sm flex items-center gap-1">
                Go to Management <ArrowRight size={16} />
              </div>
            </div>
          </Link>

          {/* Content Moderation */}
          <Link href="/admin/moderation">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
              <AlertCircle className="text-orange-500 mb-3" size={28} />
              <h3 className="text-lg font-bold text-gray-900">
                Content Moderation
              </h3>
              <p className="text-gray-600 text-sm mt-2">
                Review and moderate reported content and posts
              </p>
              <div className="mt-4 text-teal-500 hover:text-teal-600 font-medium text-sm flex items-center gap-1">
                Go to Moderation <ArrowRight size={16} />
              </div>
            </div>
          </Link>

          {/* Support Tickets */}
          <Link href="/admin/tickets">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
              <MessageSquare className="text-purple-500 mb-3" size={28} />
              <h3 className="text-lg font-bold text-gray-900">Support Tickets</h3>
              <p className="text-gray-600 text-sm mt-2">
                Manage and resolve user support requests
              </p>
              <div className="mt-4 text-teal-500 hover:text-teal-600 font-medium text-sm flex items-center gap-1">
                Go to Tickets <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
