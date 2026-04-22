'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loginUser } from '@/lib/auth';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const googleEnabled = useMemo(() => Boolean(googleClientId), [googleClientId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === '1') {
      setMessage('Your email has been verified successfully. You can sign in now.');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginUser(emailOrUsername, password);
      window.location.href = '/home';
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!googleEnabled) {
      setError('Google login is not configured yet. Please use Create Account or sign in with your password.');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid profile email';
    const responseType = 'code';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="WCNA Logo" width={120} height={120} className="rounded" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {message && (
          <div className="p-3 rounded-md text-sm mb-4" style={{ backgroundColor: '#E8F8F5', color: '#00B4A0' }}>
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md text-red-600 text-sm mb-4" style={{ backgroundColor: '#FFE5E5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Username or email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md font-semibold text-white transition-opacity"
            style={{ backgroundColor: '#00B4A0', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: '#E0E6ED' }}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white" style={{ color: '#7F8C8D' }}>
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full px-4 py-3 border rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
          style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
        >
          <span>G</span>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <Link
          href="/auth/register"
          className="block w-full mt-4 px-4 py-3 border rounded-md font-semibold text-center hover:bg-gray-50 transition-colors"
          style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
        >
          Create Account
        </Link>

        <p className="text-center text-sm mt-6" style={{ color: '#7F8C8D' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" style={{ color: '#00B4A0', fontWeight: 'bold' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
