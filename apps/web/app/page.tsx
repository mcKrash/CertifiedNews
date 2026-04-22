'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loginUser } from '@/lib/auth';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call real API login
      await loginUser(emailOrUsername, password);
      // Redirect to home on success
      window.location.href = '/home';
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Use demo credentials (seeded regular user)
      await loginUser('user@certifiednews.com', 'User123!');
      window.location.href = '/home';
    } catch (err: any) {
      setError('Demo login failed. Please use your own credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="WCNA Logo" width={120} height={120} className="rounded" />
          </div>

        </div>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>



        {/* Login Form (Also acts as bypass) */}
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Username or email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{
                borderColor: '#E0E6ED',
                color: '#2C3E50',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00B4A0';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E0E6ED';
              }}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{
                borderColor: '#E0E6ED',
                color: '#2C3E50',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00B4A0';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E0E6ED';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md font-semibold text-white transition-opacity"
            style={{
              backgroundColor: '#00B4A0',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
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

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md text-red-600 text-sm" style={{ backgroundColor: '#FFE5E5' }}>
            {error}
          </div>
        )}

        {/* Demo Login */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full px-4 py-3 border rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
          style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
        >
          <span>👤</span>
          {loading ? 'Signing in...' : 'Try Demo Account'}
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm mt-6" style={{ color: '#7F8C8D' }}>
          Don't have an account?{' '}
          <Link href="/auth/register" style={{ color: '#00B4A0', fontWeight: 'bold' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
