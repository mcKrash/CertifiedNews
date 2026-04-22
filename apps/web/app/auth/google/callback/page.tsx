'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          setError('Authorization code not received from Google');
          setLoading(false);
          return;
        }

        // Exchange authorization code for token via backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Google authentication failed');
        }

        const data = await response.json();

        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Redirect to home
        router.push('/home');
      } catch (err: any) {
        console.error('Google callback error:', err);
        setError(err.message || 'Failed to authenticate with Google');
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Signing you in with Google...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Error</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-3 rounded-md font-semibold text-white"
              style={{ backgroundColor: '#00B4A0' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
