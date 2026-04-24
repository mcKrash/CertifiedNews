'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Loader2,
  Edit2,
  UserPlus,
  UserCheck,
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
  userType: string;
  role: string;
  isVerified: boolean;
  emailVerified: boolean;
  joinedDate: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
  topicsOfInterest: string[];
  preferredLanguage: string;
}

interface Post {
  id: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'details'>('posts');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/profiles/${username}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const result = await response.json();
        setProfile(result.data);

        const activityResponse = await fetch(`${API_URL}/profiles/${username}/activity?page=1&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (activityResponse.ok) {
          const activityResult = await activityResponse.json();
          setPosts(activityResult.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !profile) {
        alert('Please log in to follow users');
        return;
      }

      const response = await fetch(`${API_URL}/profiles/${profile.id}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }

      const result = await response.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: result.following,
              followersCount: result.following ? prev.followersCount + 1 : prev.followersCount - 1,
            }
          : prev
      );
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-teal-500" size={40} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Profile not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow-sm relative z-10 p-6 mb-6">
          <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
            <div className="flex items-start gap-4">
              <img
                src={profile.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-50"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  {profile.isVerified && (
                    <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-medium">
                      Verified Profile
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {profile.userType.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${profile.emailVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {profile.emailVerified ? 'Email Verified' : 'Email Pending'}
                  </span>
                </div>
                <p className="text-gray-500">@{profile.username}</p>
                {profile.bio && <p className="text-gray-700 mt-2 max-w-md">{profile.bio}</p>}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                 Joined {new Date(profile.joinedDate).toLocaleDateString(\'en-US\', { year: \'numeric\', month: \'long\', day: \'numeric\' })}                </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {profile.isCurrentUser ? (
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors">
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${profile.isFollowing ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
                >
                  {profile.isFollowing ? (
                    <>
                      <UserCheck size={18} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-8 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.postsCount}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.followersCount}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.followingCount}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {(['posts', 'details'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === tab ? 'text-teal-500 border-b-2 border-teal-500' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No posts yet</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <p className="text-gray-900 mb-3">{post.content}</p>
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {post.images.map((img, idx) => (
                            <img key={idx} src={img} alt={`Post image ${idx + 1}`} className="rounded-lg w-full h-32 object-cover" />
                          ))}
                        </div>
                      )}
                      <div className="flex gap-4 text-gray-500 text-sm">
                        <div className="flex items-center gap-1">
                          <Heart size={16} />
                          {post.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          {post.comments}
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 size={16} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Type</h3>
                  <p className="text-gray-700">{profile.userType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Preferred Language</h3>
                  <p className="text-gray-700 uppercase">{profile.preferredLanguage}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Interests</h3>
                  {profile.topicsOfInterest.length === 0 ? (
                    <p className="text-gray-500">No interests saved yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.topicsOfInterest.map((topic) => (
                        <span key={topic} className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
