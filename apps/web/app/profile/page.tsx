'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');

  useEffect(() => {
    // Fetch current user data (using mock data for demo)
    const fetchUserProfile = async () => {
      try {
        // In production, this would fetch from the API
        // For now, we'll use the admin user as default
        const mockUser = {
          id: 1,
          username: 'admin',
          email: 'admin@certifiednews.local',
          role: 'admin',
          trustScore: 1000,
          bio: 'Senior Editor and Fact-Checker at Certified News. Dedicated to ensuring accuracy and integrity in journalism.',
          interests: ['Investigative Journalism', 'Climate Change', 'Technology', 'Politics'],
          joinedAt: '2025-01-15T10:00:00.000Z',
          avatarUrl: null,
        };
        setUser(mockUser);
        setEditedBio(mockUser.bio);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleSaveBio = () => {
    if (user) {
      setUser({ ...user, bio: editedBio });
      setIsEditing(false);
      alert('Bio updated successfully!');
    }
  };

  const handleGoHome = () => {
    router.push('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F7FA' }}>
        <p style={{ color: '#2C3E50' }}>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F7FA' }}>
        <p style={{ color: '#E74C3C' }}>User not found</p>
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#E74C3C';
      case 'verified_reporter':
        return '#00B4A0';
      case 'member':
        return '#3498DB';
      default:
        return '#95A5A6';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'verified_reporter':
        return 'Verified Reporter';
      case 'member':
        return 'Community Member';
      default:
        return 'User';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span style={{ color: '#00B4A0' }}>CERTIFIED</span>
            <span style={{ color: '#2C3E50' }}> NEWS</span>
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoHome}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: '#00B4A0' }}
            >
              Back to Feed
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: '#E74C3C' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg border shadow-sm p-8 mb-8" style={{ borderColor: '#E0E6ED' }}>
          <div className="flex items-start gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-6xl border-4 shadow-md"
                style={{ borderColor: '#00B4A0', backgroundColor: '#E8F8F5' }}
              >
                👤
              </div>
              <p className="text-xs text-gray-500 mt-2">Profile Picture</p>
            </div>

            {/* User Info Section */}
            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>
                  {user.username}
                </h1>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: '#F39C12' }}
                  >
                    Trust Score: {user.trustScore}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3">
                  <span style={{ color: '#95A5A6' }} className="text-sm font-semibold">Email:</span>
                  <span style={{ color: '#2C3E50' }} className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: '#95A5A6' }} className="text-sm font-semibold">Joined:</span>
                  <span style={{ color: '#2C3E50' }} className="text-sm">
                    {new Date(user.joinedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-lg border shadow-sm p-8 mb-8" style={{ borderColor: '#E0E6ED' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
              About Me
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: isEditing ? '#95A5A6' : '#00B4A0' }}
            >
              {isEditing ? 'Cancel' : 'Edit Bio'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
                placeholder="Tell us about yourself..."
              />
              <button
                onClick={handleSaveBio}
                className="px-6 py-2 rounded-md font-bold text-white"
                style={{ backgroundColor: '#00B4A0' }}
              >
                Save Bio
              </button>
            </div>
          ) : (
            <p style={{ color: '#2C3E50' }} className="text-base leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>

        {/* Interests Section */}
        <div className="bg-white rounded-lg border shadow-sm p-8 mb-8" style={{ borderColor: '#E0E6ED' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#2C3E50' }}>
            Interests & Topics
          </h2>
          <div className="flex flex-wrap gap-3">
            {user.interests && user.interests.length > 0 ? (
              user.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: '#00B4A0' }}
                >
                  {interest}
                </span>
              ))
            ) : (
              <p style={{ color: '#95A5A6' }}>No interests added yet</p>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E0E6ED' }}>
            <div className="text-center">
              <p style={{ color: '#95A5A6' }} className="text-sm font-semibold mb-2">
                Trust Score
              </p>
              <p className="text-4xl font-bold" style={{ color: '#00B4A0' }}>
                {user.trustScore}
              </p>
              <p style={{ color: '#95A5A6' }} className="text-xs mt-2">
                Out of 1000
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E0E6ED' }}>
            <div className="text-center">
              <p style={{ color: '#95A5A6' }} className="text-sm font-semibold mb-2">
                Role
              </p>
              <p className="text-2xl font-bold" style={{ color: getRoleColor(user.role) }}>
                {getRoleLabel(user.role)}
              </p>
              <p style={{ color: '#95A5A6' }} className="text-xs mt-2">
                Verified Status
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E0E6ED' }}>
            <div className="text-center">
              <p style={{ color: '#95A5A6' }} className="text-sm font-semibold mb-2">
                Member Since
              </p>
              <p className="text-lg font-bold" style={{ color: '#2C3E50' }}>
                {new Date(user.joinedAt).getFullYear()}
              </p>
              <p style={{ color: '#95A5A6' }} className="text-xs mt-2">
                {new Date(user.joinedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
