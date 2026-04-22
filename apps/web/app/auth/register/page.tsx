'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [onboardingData, setOnboardingData] = useState({
    topicsOfInterest: [] as string[],
    preferredLanguage: 'en',
    avatarStyle: 'adventurer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [userName, setUserName] = useState('');

  const topics = ['Politics', 'Technology', 'Sports', 'Business', 'Entertainment', 'Science', 'Health', 'World News'];
  const avatarStyles = ['adventurer', 'avataaars', 'bottts', 'croodles', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'notionists', 'open-peeps', 'personas', 'pixel-art'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTopicToggle = (topic: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      topicsOfInterest: prev.topicsOfInterest.includes(topic)
        ? prev.topicsOfInterest.filter((t) => t !== topic)
        : [...prev.topicsOfInterest, topic],
    }));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerificationMessage('');

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
        'REGULAR_USER',
        formData.username
      );

      setToken(response.data.token);
      setUserName(response.data.user.name);
      setVerificationMessage(
        response.data.verificationEmailSent
          ? 'Your verification email has been sent. Please check your inbox after completing setup.'
          : response.data.verificationEmailReason || 'Your account was created, but the verification email could not be sent yet.'
      );
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const avatarUrl = `https://api.dicebear.com/7.x/${onboardingData.avatarStyle}/svg?seed=${encodeURIComponent(formData.email)}`;
      const response = await fetch(`${API_URL}/auth/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topicsOfInterest: onboardingData.topicsOfInterest,
          preferredLanguage: onboardingData.preferredLanguage,
          avatarUrl,
          name: formData.name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save preferences');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="WCNA Logo" width={100} height={100} className="rounded" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h2>
            <p className="text-gray-600">Join the World Certified News Alliance</p>
          </div>

          {error && (
            <div className="p-3 mb-6 rounded-md text-red-600 text-sm" style={{ backgroundColor: '#FFE5E5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]" style={{ borderColor: '#E0E6ED' }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]" style={{ borderColor: '#E0E6ED' }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]" style={{ borderColor: '#E0E6ED' }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]" style={{ borderColor: '#E0E6ED' }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]" style={{ borderColor: '#E0E6ED' }} />
            </div>

            <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/" className="text-[#00B4A0] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">Welcome {userName || formData.name}. Let&apos;s personalize your news experience.</p>
        </div>

        {verificationMessage && (
          <div className="p-3 mb-6 rounded-md text-sm" style={{ backgroundColor: '#E8F8F5', color: '#00B4A0' }}>
            {verificationMessage}
          </div>
        )}

        {error && (
          <div className="p-3 mb-6 rounded-md text-red-600 text-sm" style={{ backgroundColor: '#FFE5E5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleOnboardingSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Choose Your Avatar</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {avatarStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setOnboardingData((prev) => ({ ...prev, avatarStyle: style }))}
                  className={`p-2 rounded-md border-2 transition ${
                    onboardingData.avatarStyle === style
                      ? 'border-[#00B4A0] bg-[#00B4A0]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(formData.email)}`}
                    alt={style}
                    className="w-full h-20 object-contain"
                  />
                  <p className="text-xs text-gray-600 mt-2 capitalize">{style}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Topics of Interest</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicToggle(topic)}
                  className={`py-2 px-4 rounded-md border-2 transition font-medium ${
                    onboardingData.topicsOfInterest.includes(topic)
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
              name="preferredLanguage"
              value={onboardingData.preferredLanguage}
              onChange={(e) => setOnboardingData((prev) => ({ ...prev, preferredLanguage: e.target.value }))}
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

          <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50">
            {loading ? 'Saving Preferences...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
