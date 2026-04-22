'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';
const AVATAR_STYLES = ['adventurer', 'avataaars', 'bottts', 'croodles', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'notionists', 'open-peeps', 'personas', 'pixel-art'];
const TOPICS = ['Politics', 'Technology', 'Sports', 'Business', 'Entertainment', 'Science', 'Health', 'World News'];

export default function JournalistRegisterPage() {
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
  const [profileData, setProfileData] = useState({
    beat: '',
    affiliatedOrg: '',
    portfolioUrl: '',
  });
  const [preferencesData, setPreferencesData] = useState({
    topicsOfInterest: [] as string[],
    preferredLanguage: 'en',
    avatarStyle: 'adventurer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (step === 1) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTopicToggle = (topic: string) => {
    setPreferencesData((prev) => ({
      ...prev,
      topicsOfInterest: prev.topicsOfInterest.includes(topic)
        ? prev.topicsOfInterest.filter((item) => item !== topic)
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
      const response = await registerUser(formData.email, formData.password, formData.name, 'JOURNALIST', formData.username);
      setToken(response.data.token);
      setVerificationMessage(
        response.data.verificationEmailSent
          ? 'Verification email sent successfully. Finish your journalist setup, then verify your inbox.'
          : response.data.verificationEmailReason || 'Your account was created, but the verification email still needs attention.'
      );
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
      const avatarUrl = `https://api.dicebear.com/7.x/${preferencesData.avatarStyle}/svg?seed=${encodeURIComponent(formData.email)}`;

      const profileResponse = await fetch(`${API_URL}/auth/journalist-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...profileData,
          avatarUrl,
        }),
      });

      const profileResult = await profileResponse.json();
      if (!profileResponse.ok) {
        throw new Error(profileResult.message || 'Failed to save journalist profile');
      }

      const preferencesResponse = await fetch(`${API_URL}/auth/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topicsOfInterest: preferencesData.topicsOfInterest,
          preferredLanguage: preferencesData.preferredLanguage,
          avatarUrl,
        }),
      });

      const preferencesResult = await preferencesResponse.json();
      if (!preferencesResponse.ok) {
        throw new Error(preferencesResult.message || 'Failed to save preferences');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(preferencesResult.data.user));
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to complete journalist setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="WCNA Logo" width={100} height={100} className="rounded" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Register as Journalist</h2>
          <p className="text-gray-600">Step {step} of 2</p>
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

        {step === 1 && (
          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <input type="text" name="name" required placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="text" name="username" required placeholder="Username" value={formData.username} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="email" name="email" required placeholder="Email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="password" name="password" required placeholder="Password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="password" name="confirmPassword" required placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50">
              {loading ? 'Creating Account...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="beat" placeholder="Beat or specialty" value={profileData.beat} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="text" name="affiliatedOrg" placeholder="Affiliated organization" value={profileData.affiliatedOrg} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            </div>
            <input type="url" name="portfolioUrl" placeholder="Portfolio URL" value={profileData.portfolioUrl} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Choose your avatar</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setPreferencesData((prev) => ({ ...prev, avatarStyle: style }))}
                    className={`p-3 rounded-md border-2 ${preferencesData.avatarStyle === style ? 'border-[#00B4A0] bg-[#E8F8F5]' : 'border-gray-200'}`}
                  >
                    <img src={`https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(formData.email)}`} alt={style} className="w-full h-20 object-contain" />
                    <p className="text-xs mt-2 capitalize">{style}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Topics of interest</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`py-2 px-4 rounded-md border-2 font-medium ${preferencesData.topicsOfInterest.includes(topic) ? 'border-[#00B4A0] bg-[#00B4A0] text-white' : 'border-gray-200 text-gray-700'}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <select value={preferencesData.preferredLanguage} onChange={(e) => setPreferencesData((prev) => ({ ...prev, preferredLanguage: e.target.value }))} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
              <option value="ar">Arabic</option>
            </select>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 px-4 border rounded-md font-medium" style={{ borderColor: '#E0E6ED' }}>
                Back
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-3 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50">
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account? <Link href="/" className="text-[#00B4A0] hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
