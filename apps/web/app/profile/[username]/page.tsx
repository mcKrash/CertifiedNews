'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Link as LinkIcon,
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
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  userType: string;
  isVerified: boolean;
  location?: string;
  website?: string;
  joinedDate: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
}

interface Post {
  id: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>(
    'posts'
  );

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

        // Fetch user activity
        const activityResponse = await fetch(
          `${API_URL}/profiles/${username}/activity?page=1&limit=10`
        );
        if (activityResponse.ok) {
          const activityResult = await activityResponse.json();
          setPosts(activityResult.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, API_URL]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to follow users');
        return;
      }

      const response = await fetch(`${API_URL}/profiles/${profile?.id}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProfile(prev =>
          prev
            ? {
                ...prev,
                isFollowing: !prev.isFollowing,
                followersCount: prev.isFollowing
                  ? prev.followersCount - 1
                  : prev.followersCount + 1,
              }
            : null
        );
      }
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
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-teal-500 to-teal-600">
        {profile.coverUrl && (
          <img
            src={profile.coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm -mt-16 relative z-10 p-6 mb-6">
          <div className="flex items-start justify-between gap-6">
            {/* Avatar and Info */}
            <div className="flex items-start gap-4">
              <img
                src={
                  profile.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
                }
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.name}
                  </h1>
                  {profile.isVerified && (
                    <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-medium">
                      ✓ Verified
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {profile.userType}
                  </span>
                </div>
                <p className="text-gray-500">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-700 mt-2 max-w-md">{profile.bio}</p>
                )}

                {/* Profile Details */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-teal-500 hover:text-teal-600"
                    >
                      <LinkIcon size={16} />
                      Website
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    Joined{' '}
                    {new Date(profile.joinedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {profile.isCurrentUser ? (
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors">
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    profile.isFollowing
                      ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
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

          {/* Stats */}
          <div className="flex gap-8 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {profile.postsCount}
              </div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <button className="text-center hover:opacity-75 transition-opacity">
              <div className="text-2xl font-bold text-gray-900">
                {profile.followersCount}
              </div>
              <div className="text-sm text-gray-600">Followers</div>
            </button>
            <button className="text-center hover:opacity-75 transition-opacity">
              <div className="text-2xl font-bold text-gray-900">
                {profile.followingCount}
              </div>
              <div className="text-sm text-gray-600">Following</div>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {(['posts', 'followers', 'following'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-teal-500 border-b-2 border-teal-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No posts yet</p>
                ) : (
                  posts.map(post => (
                    <div
                      key={post.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-gray-900 mb-3">{post.content}</p>
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {post.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="rounded-lg w-full h-32 object-cover"
                            />
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

            {activeTab === 'followers' && (
              <div className="text-center text-gray-500 py-8">
                Followers list coming soon
              </div>
            )}

            {activeTab === 'following' && (
              <div className="text-center text-gray-500 py-8">
                Following list coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
