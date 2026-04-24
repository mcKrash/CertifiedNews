'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authenticatedFetch, fetchCurrentUser, getCurrentUser, logoutUser, type User } from '@/lib/auth';

interface ProfileState extends User {
  topicsOfInterest: string[];
  joinedDate: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';

const buildProfileState = (user: User): ProfileState => ({
  ...user,
  topicsOfInterest: user.preferences?.topicsOfInterest || [],
  joinedDate: user.createdAt || null,
});

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileState | null>(() => {
    const currentUser = getCurrentUser();
    return currentUser ? buildProfileState(currentUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        if (!currentUser) {
          router.replace('/');
          return;
        }

        const profileState = buildProfileState(currentUser);
        setUser(profileState);
        setEditedBio(profileState.bio || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const joinedLabel = useMemo(() => {
    if (!user?.joinedDate) return 'Recently joined';

    const date = new Date(user.joinedDate);
    if (Number.isNaN(date.getTime())) return 'Recently joined';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [user?.joinedDate]);

  const avatarUrl = user?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.username || 'wcna-user')}`;

  const handleLogout = () => {
    logoutUser('/');
  };

  const handleSaveBio = async () => {
    if (!user) return;

    setSaveLoading(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/profiles/me`, {
        method: 'PUT',
        body: JSON.stringify({ bio: editedBio, name: user.name, avatarUrl: user.avatarUrl, topicsOfInterest: user.topicsOfInterest }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update bio');
      }

      const updatedUser = buildProfileState(data?.data || { ...user, bio: editedBio });

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving bio:', error);
      alert(error instanceof Error ? error.message : 'Failed to update bio');
    } finally {
      setSaveLoading(false);
    }
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="WCNA Logo" width={48} height={48} className="rounded" />
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#2C3E50' }}>WCNA</span>
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/home')} className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#00B4A0' }}>
              Back to Feed
            </button>
            <button onClick={handleLogout} className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#E74C3C' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg border shadow-sm p-8 mb-8" style={{ borderColor: '#E0E6ED' }}>
          <div className="flex items-start gap-8 flex-col md:flex-row">
            <div className="flex flex-col items-center">
              <img src={avatarUrl} alt={user.name} className="w-32 h-32 rounded-full border-4 shadow-md object-cover" style={{ borderColor: '#00B4A0', backgroundColor: '#E8F8F5' }} />
              <p className="text-xs text-gray-500 mt-2">Profile Picture</p>
            </div>

            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-1" style={{ color: '#2C3E50' }}>
                  {user.name}
                </h1>
                <p className="text-base mb-4" style={{ color: '#7F8C8D' }}>
                  @{user.username}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3">
                  <span style={{ color: '#95A5A6' }} className="text-sm font-semibold">Email:</span>
                  <span style={{ color: '#2C3E50' }} className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: '#95A5A6' }} className="text-sm font-semibold">Joined:</span>
                  <span style={{ color: '#2C3E50' }} className="text-sm">{joinedLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: '#95A5A6' }} className="text-sm font-semibold">Account Type:</span>
                  <span style={{ color: '#2C3E50' }} className="text-sm">{user.userType.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-8 mb-8" style={{ borderColor: '#E0E6ED' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
              About Me
            </h2>
            <button
              onClick={() => setIsEditing((prev) => !prev)}
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
                disabled={saveLoading}
                className="px-6 py-2 rounded-md font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: '#00B4A0' }}
              >
                {saveLoading ? 'Saving...' : 'Save Bio'}
              </button>
            </div>
          ) : (
            <p style={{ color: '#2C3E50' }} className="text-base leading-relaxed">
              {user.bio || 'No bio added yet.'}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-8 mb-8" style={{ borderColor: '#E0E6ED' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#2C3E50' }}>
            Interests & Topics
          </h2>
          <div className="flex flex-wrap gap-3">
            {user.topicsOfInterest.length > 0 ? (
              user.topicsOfInterest.map((interest) => (
                <span
                  key={interest}
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
      </main>
    </div>
  );
}
