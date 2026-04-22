'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';

export default function JournalistRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Registration, 2: Profile, 3: Preferences
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [profileData, setProfileData] = useState({
    beat: '',
    affiliatedOrg: '',
    portfolioUrl: '',
  });
  const [preferencesData, setPreferencesData] = useState({
    topicsOfInterest: [] as string[],
    preferredLanguage: 'en',
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const topics = ['Politics', 'Technology', 'Sports', 'Business', 'Entertainment', 'Science', 'Health', 'World News'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (step === 1) {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (step === 2) {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const handleTopicToggle = (topic: string) => {
    setPreferencesData(prev => ({
      ...prev,
      topicsOfInterest: prev.topicsOfInterest.includes(topic)
        ? prev.topicsOfInterest.filter(t => t !== topic)
        : [...prev.topicsOfInterest, topic],
    }));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser(
        formData.email,
        formData.password,
        formData.name,
        'JOURNALIST'
      );
      setToken(response.data.token);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let profilePhotoUrl = '';
      
      if (profilePhoto) {
        const formDataPhoto = new FormData();
        formDataPhoto.append('file', profilePhoto);
        
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataPhoto,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }

        const uploadData = await uploadResponse.json();
        profilePhotoUrl = uploadData.url;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/journalist-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...profileData,
          topicsOfInterest: preferencesData.topicsOfInterest,
          preferredLanguage: preferencesData.preferredLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      localStorage.setItem('token', token);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="WCNA Logo" width={100} height={100} className="rounded" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Register as Journalist</h2>
          <p className="text-gray-600">Step {step} of 3</p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-md text-red-600 text-sm" style={{ backgroundColor: '#FFE5E5' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Next'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo (Required)</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={handlePhotoChange}
                className="w-full px-4 py-2 border rounded-md"
                style={{ borderColor: '#E0E6ED' }}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 200x200px</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beat/Specialty</label>
              <input
                type="text"
                name="beat"
                placeholder="e.g., Politics, Sports, Technology"
                value={profileData.beat}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affiliated Organization</label>
              <input
                type="text"
                name="affiliatedOrg"
                placeholder="e.g., The New York Times"
                value={profileData.affiliatedOrg}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
              <input
                type="url"
                name="portfolioUrl"
                placeholder="https://yourportfolio.com"
                value={profileData.portfolioUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 border rounded-md font-medium hover:bg-gray-50"
                style={{ borderColor: '#E0E6ED' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Next'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePreferencesSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Topics of Interest</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {topics.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`py-2 px-4 rounded-md border-2 transition font-medium ${
                      preferencesData.topicsOfInterest.includes(topic)
                        ? 'border-[#00B4A0] bg-[#00B4A0] text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language</label>
              <select
                value={preferencesData.preferredLanguage}
                onChange={(e) => setPreferencesData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
                <option value="ar">Arabic</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </select>
            </div>

            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              ℹ️ Your journalist account is pending verification. You can start posting immediately, but your posts will be labeled as "Unverified Journalist" until approved by our admin team.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2 px-4 border rounded-md font-medium hover:bg-gray-50"
                style={{ borderColor: '#E0E6ED' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50"
              >
                {loading ? 'Completing...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          Want to register as a regular user?{' '}
          <Link href="/register" className="text-[#00B4A0] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
