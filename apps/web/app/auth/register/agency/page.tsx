'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';
const AGENCY_TYPES = ['Newspaper', 'TV', 'Digital', 'Wire Service', 'Magazine'];

export default function AgencyRegisterPage() {
  const router = useRouter();
  const [verificationMessage, setVerificationMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agencyData, setAgencyData] = useState({
    organizationName: '',
    website: '',
    country: '',
    agencyType: '',
    registrationNumber: '',
    primaryContactName: '',
    primaryContactEmail: '',
    description: '',
    twitter: '',
    facebook: '',
    instagram: '',
    logoUrl: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgencyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAgencyData((prev) => ({ ...prev, [name]: value }));
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
      const response = await registerUser(formData.email, formData.password, formData.name, 'AGENCY', formData.username);
      setToken(response.data.token);
      setVerificationMessage(
        response.data.verificationEmailSent
          ? 'Verification email sent successfully. Finish your agency setup, then verify your inbox.'
          : response.data.verificationEmailReason || 'Your account was created, but the verification email still needs attention.'
      );
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/agency-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationName: agencyData.organizationName,
          website: agencyData.website,
          country: agencyData.country,
          agencyType: agencyData.agencyType,
          registrationNumber: agencyData.registrationNumber,
          primaryContactName: agencyData.primaryContactName,
          primaryContactEmail: agencyData.primaryContactEmail,
          logoUrl: agencyData.logoUrl,
          description: agencyData.description,
          socialHandles: {
            twitter: agencyData.twitter,
            facebook: agencyData.facebook,
            instagram: agencyData.instagram,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save agency profile');
      }

      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userResult = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userResult.message || 'Failed to refresh user profile');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userResult.data));
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to complete agency setup');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Register as News Agency</h2>
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
            <input type="text" name="name" required placeholder="Primary contact name" value={formData.name} onChange={handleAccountChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="text" name="username" required placeholder="Agency username" value={formData.username} onChange={handleAccountChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="email" name="email" required placeholder="Email" value={formData.email} onChange={handleAccountChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="password" name="password" required placeholder="Password" value={formData.password} onChange={handleAccountChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <input type="password" name="confirmPassword" required placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleAccountChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985] disabled:opacity-50">
              {loading ? 'Creating Account...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleAgencySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="organizationName" required placeholder="Organization name" value={agencyData.organizationName} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="url" name="website" required placeholder="Official website URL" value={agencyData.website} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="text" name="country" required placeholder="Country of operation" value={agencyData.country} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <select name="agencyType" required value={agencyData.agencyType} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }}>
                <option value="">Agency type</option>
                {AGENCY_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input type="text" name="registrationNumber" placeholder="Registration or license number" value={agencyData.registrationNumber} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="text" name="primaryContactName" required placeholder="Primary contact name" value={agencyData.primaryContactName} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="email" name="primaryContactEmail" required placeholder="Primary contact email" value={agencyData.primaryContactEmail} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="url" name="logoUrl" placeholder="Logo image URL" value={agencyData.logoUrl} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="text" name="twitter" placeholder="Twitter/X handle" value={agencyData.twitter} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="text" name="facebook" placeholder="Facebook handle" value={agencyData.facebook} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
              <input type="text" name="instagram" placeholder="Instagram handle" value={agencyData.instagram} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md" style={{ borderColor: '#E0E6ED' }} />
            </div>
            <textarea name="description" maxLength={500} placeholder="Brief description" value={agencyData.description} onChange={handleAgencyChange} className="w-full px-4 py-3 border rounded-md min-h-[140px]" style={{ borderColor: '#E0E6ED' }} />
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 px-4 border rounded-md font-medium" style={{ borderColor: '#E0E6ED' }}>Back</button>
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
