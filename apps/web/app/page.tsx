'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Single-click bypass: Store dummy session and redirect to home immediately
    const dummyUser = {
      id: 1,
      username: emailOrUsername || 'admin',
      email: emailOrUsername.includes('@') ? emailOrUsername : 'admin@certifiednews.local',
      role: 'admin',
      trustScore: 1000
    };

    localStorage.setItem('token', 'dummy-bypass-token-' + Date.now());
    localStorage.setItem('user', JSON.stringify(dummyUser));
    
    // Immediate redirect to main feed
    window.location.href = '/home';
  };

  const handleBypass = () => {
    setLoading(true);
    const dummyUser = {
      id: 1,
      username: 'admin',
      email: 'admin@certifiednews.local',
      role: 'admin',
      trustScore: 1000
    };
    localStorage.setItem('token', 'dummy-bypass-token-' + Date.now());
    localStorage.setItem('user', JSON.stringify(dummyUser));
    window.location.href = '/home';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span style={{ color: '#00B4A0' }}>CERTIFIED</span>
            <span style={{ color: '#2C3E50' }}> NEWS</span>
          </h1>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Quick Access Bypass */}
        <div className="mb-6 p-4 rounded-md" style={{ backgroundColor: '#E8F8F5', borderLeft: '4px solid #00B4A0' }}>
          <p className="text-sm font-semibold" style={{ color: '#00B4A0' }}>Quick Access:</p>
          <p className="text-xs mt-1" style={{ color: '#2C3E50' }}>
            Click below to enter the platform immediately.
          </p>
          <button
            type="button"
            onClick={handleBypass}
            disabled={loading}
            className="mt-3 w-full px-3 py-3 text-sm font-bold rounded-md text-white transition-opacity"
            style={{ backgroundColor: '#00B4A0', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Entering...' : 'Enter Main Feed'}
          </button>
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

        {/* Google Login (Also acts as bypass) */}
        <button
          type="button"
          onClick={handleBypass}
          className="w-full px-4 py-3 border rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          style={{ borderColor: '#E0E6ED', color: '#2C3E50' }}
        >
          <span>🔍</span>
          Sign in with Google
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
