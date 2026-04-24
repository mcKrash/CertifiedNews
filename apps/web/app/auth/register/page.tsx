'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getToken, requestRegistrationOtp, resendRegistrationOtp, verifyRegistrationOtp } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';
const TOPICS = ['Politics', 'Technology', 'Sports', 'Business', 'Entertainment', 'Science', 'Health', 'World News'];
const AVATAR_STYLES = ['adventurer', 'avataaars', 'bottts', 'croodles', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'notionists', 'open-peeps', 'personas', 'pixel-art'];
const AVATAR_COUNT = 8;

interface AvatarOption {
  id: string;
  style: string;
  url: string;
}

const buildAvatarOptions = (email: string, refreshIndex: number): AvatarOption[] => {
  return Array.from({ length: AVATAR_COUNT }, (_, index) => {
    const style = AVATAR_STYLES[(refreshIndex + index) % AVATAR_STYLES.length];
    const seed = `${email}-${refreshIndex}-${index}-${style}`;

    return {
      id: `${refreshIndex}-${index}-${style}`,
      style,
      url: `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`,
    };
  });
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
  const [onboardingData, setOnboardingData] = useState({
    topicsOfInterest: [] as string[],
    preferredLanguage: 'en',
  });

  const avatarOptions = useMemo(() => buildAvatarOptions(formData.email || formData.username || 'wcna-user', refreshIndex), [formData.email, formData.username, refreshIndex]);

  useEffect(() => {
    if (!selectedAvatarUrl && avatarOptions.length > 0) {
      setSelectedAvatarUrl(avatarOptions[0].url);
    }
  }, [avatarOptions, selectedAvatarUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTopic = (topic: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      topicsOfInterest: prev.topicsOfInterest.includes(topic)
        ? prev.topicsOfInterest.filter((item) => item !== topic)
        : [...prev.topicsOfInterest, topic],
    }));
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await requestRegistrationOtp(
        formData.email,
        formData.password,
        formData.name,
        'REGULAR_USER',
        formData.username
      );

      setVerificationMessage(`We sent a 5-digit code to ${response.data.email}. Enter it below to continue.`);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationMessage('');

    if (!/^\d{5}$/.test(otpCode.trim())) {
      setError('Please enter the correct 5 digit code');
      return;
    }

    setLoading(true);
    try {
      await verifyRegistrationOtp(formData.email, otpCode.trim());
      setVerificationMessage('Email verified successfully. Now complete your profile setup.');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setVerificationMessage('');
    setLoading(true);
    try {
      const response = await resendRegistrationOtp(formData.email);
      setVerificationMessage(`A new 5-digit code was sent to ${response.data.email}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAvatars = () => {
    const nextRefreshIndex = refreshIndex + AVATAR_COUNT;
    const nextOptions = buildAvatarOptions(formData.email || formData.username || 'wcna-user', nextRefreshIndex);
    setRefreshIndex(nextRefreshIndex);
    setSelectedAvatarUrl(nextOptions[0]?.url || '');
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationMessage('');
    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Your session expired. Please register again.');
      }

      const response = await fetch(`${API_URL}/auth/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topicsOfInterest: onboardingData.topicsOfInterest,
          preferredLanguage: onboardingData.preferredLanguage,
          avatarUrl: selectedAvatarUrl,
          name: formData.name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save preferences');
      }

      localStorage.setItem('user', JSON.stringify(data.data.user));
      router.replace('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {step === 1 ? 'Create Account' : step === 2 ? 'Verify Your Email' : 'Complete Your Profile'}
          </h2>
          <p className="text-gray-600">Step {step} of 3</p>
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
          <form onSubmit={handleRequestOtp} className="space-y-4 max-w-md mx-auto">
            <input type="text" name="name" required placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="text" name="username" required placeholder="Username" value={formData.username} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="email" name="email" required placeholder="Email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="password" name="password" required placeholder="Password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="password" name="confirmPassword" required placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50">
              {loading ? 'Sending Code...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              required
              placeholder="Enter 5 digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="w-full px-4 py-3 border rounded-md text-center tracking-[0.4em] text-lg"
              style={{ borderColor: '#E0E6ED' }}
            />
            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button type="button" onClick={handleResendOtp} disabled={loading} className="w-full py-3 px-4 border rounded-md font-medium disabled:opacity-50" style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}>
              Resend Code
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleOnboardingSubmit} className="space-y-8">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4 flex-col sm:flex-row">
                <label className="block text-sm font-medium text-gray-700">Choose Your Avatar</label>
                <button type="button" onClick={handleRefreshAvatars} className="px-4 py-2 border rounded-md font-medium" style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}>
                  Refresh Avatars
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {avatarOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedAvatarUrl(option.url)}
                    className={`p-3 rounded-md border-2 transition ${selectedAvatarUrl === option.url ? 'border-[#00B4A0] bg-[#E8F8F5]' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <img src={option.url} alt={option.style} className="w-full h-24 object-contain" />
                    <p className="text-xs mt-2 capitalize text-gray-600">{option.style}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Topics of Interest</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`py-2 px-4 rounded-md border-2 transition font-medium ${onboardingData.topicsOfInterest.includes(topic) ? 'border-[#00B4A0] bg-[#00B4A0] text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
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
                className="w-full px-4 py-3 border rounded-md"
                style={{ borderColor: '#E0E6ED' }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50">
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account? <Link href="/" className="text-[#00B4A0] hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
