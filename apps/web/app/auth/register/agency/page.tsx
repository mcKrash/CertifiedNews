'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';

export default function AgencyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Registration, 2: Organization, 3: Contact, 4: Preferences
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [organizationData, setOrganizationData] = useState({
    organizationName: '',
    website: '',
    country: '',
    agencyType: '',
    registrationNumber: '',
  });
  const [contactData, setContactData] = useState({
    primaryContactName: '',
    primaryContactEmail: '',
    twitter: '',
    facebook: '',
    instagram: '',
  });
  const [preferencesData, setPreferencesData] = useState({
    description: '',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const agencyTypes = ['Newspaper', 'TV', 'Digital', 'Wire Service', 'Magazine'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (step === 1) {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (step === 2) {
      setOrganizationData(prev => ({ ...prev, [name]: value }));
    } else if (step === 3) {
      setContactData(prev => ({ ...prev, [name]: value }));
    } else if (step === 4) {
      setPreferencesData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setLogo(e.target.files[0]);
    }
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
        'AGENCY'
      );
      setToken(response.data.token);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationData.organizationName || !organizationData.website || !organizationData.country || !organizationData.agencyType) {
      setError('Please fill in all required fields');
      return;
    }
    setStep(3);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactData.primaryContactName || !contactData.primaryContactEmail) {
      setError('Please fill in all required fields');
      return;
    }
    setStep(4);
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let logoUrl = '';
      
      if (logo) {
        const formDataLogo = new FormData();
        formDataLogo.append('file', logo);
        
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataLogo,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload logo');
        }

        const uploadData = await uploadResponse.json();
        logoUrl = uploadData.url;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/agency-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...organizationData,
          ...contactData,
          logoUrl,
          description: preferencesData.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save agency profile');
      }

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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Register as News Agency</h2>
          <p className="text-gray-600">Step {step} of 4</p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-md text-red-600 text-sm" style={{ backgroundColor: '#FFE5E5' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name</label>
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
          <form onSubmit={handleOrganizationSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
              <input
                type="text"
                name="organizationName"
                required
                value={organizationData.organizationName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Official Website *</label>
              <input
                type="url"
                name="website"
                required
                value={organizationData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                name="country"
                required
                value={organizationData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Type *</label>
              <select
                name="agencyType"
                required
                value={organizationData.agencyType}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              >
                <option value="">Select agency type</option>
                {agencyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration/License Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={organizationData.registrationNumber}
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
                className="flex-1 py-2 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985]"
              >
                Next
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name *</label>
              <input
                type="text"
                name="primaryContactName"
                required
                value={contactData.primaryContactName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Email *</label>
              <input
                type="email"
                name="primaryContactEmail"
                required
                value={contactData.primaryContactEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Logo (Required)</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={handleLogoChange}
                className="w-full px-4 py-2 border rounded-md"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
              <input
                type="text"
                name="twitter"
                placeholder="@yourhandle"
                value={contactData.twitter}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page</label>
              <input
                type="text"
                name="facebook"
                placeholder="facebook.com/yourpage"
                value={contactData.facebook}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
              <input
                type="text"
                name="instagram"
                placeholder="@yourhandle"
                value={contactData.instagram}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
            </div>

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
                className="flex-1 py-2 px-4 bg-[#00B4A0] text-white rounded-md font-medium hover:bg-[#009985]"
              >
                Next
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handlePreferencesSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brief Description (Max 500 characters)</label>
              <textarea
                name="description"
                maxLength={500}
                value={preferencesData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
                style={{ borderColor: '#E0E6ED' }}
              />
              <p className="text-xs text-gray-500 mt-1">{preferencesData.description.length}/500</p>
            </div>

            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              ℹ️ Your agency account is pending verification. Your posts will be labeled as "Pending Verification" until approved by our admin team.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
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
