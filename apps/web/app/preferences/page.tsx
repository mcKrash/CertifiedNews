'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PreferencesIcon } from '@/lib/icons';

const CATEGORY_OPTIONS = [
  { id: 'all', name: 'All News' },
  { id: 'sport', name: 'Sport' },
  { id: 'politics', name: 'Politics' },
  { id: 'tech', name: 'Technology' },
  { id: 'science', name: 'Science' },
  { id: 'health', name: 'Health' },
];

const DEFAULT_PREFERENCES = {
  defaultCategory: 'all',
  verifiedOnly: true,
  liveTickerEnabled: true,
  breakingAlerts: true,
  compactFeed: false,
  safeDiscussionsOnly: true,
  digestFrequency: 'daily',
};

export default function PreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const storedPreferences = localStorage.getItem('wcna_preferences');
    if (storedPreferences) {
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...JSON.parse(storedPreferences),
      });
    }
  }, []);

  const updatePreference = (key: keyof typeof DEFAULT_PREFERENCES, value: string | boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSavedMessage('');
  };

  const handleSave = () => {
    localStorage.setItem('wcna_preferences', JSON.stringify(preferences));
    setSavedMessage('Your preferences were saved successfully.');
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem('wcna_preferences', JSON.stringify(DEFAULT_PREFERENCES));
    setSavedMessage('Preferences were reset to the WCNA default experience.');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="WCNA Logo" width={48} height={48} className="rounded" />
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#2C3E50' }}>WCNA</span>
          </Link>
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white"
            style={{ backgroundColor: '#00B4A0' }}
          >
            Back to Feed
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border shadow-sm p-8 mb-8" style={{ borderColor: '#E0E6ED' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8F8F5' }}>
              <PreferencesIcon size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C3E50' }}>User Preferences</h1>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: '#7F8C8D' }}>
                Adjust how WCNA presents news to you. These settings are saved in the browser and are designed to support a safer, more relevant, and more efficient reading experience.
              </p>
            </div>
          </div>

          {savedMessage && (
            <div className="mb-6 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#E8F8F5', color: '#00B4A0' }}>
              {savedMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border p-6" style={{ borderColor: '#E0E6ED' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#2C3E50' }}>Feed Personalization</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Default category</label>
                  <select
                    value={preferences.defaultCategory}
                    onChange={(e) => updatePreference('defaultCategory', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none"
                    style={{ borderColor: '#E0E6ED' }}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2C3E50' }}>Show only verified stories</p>
                    <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>Keeps the main feed focused on certified reporting.</p>
                  </div>
                  <input type="checkbox" checked={preferences.verifiedOnly} onChange={(e) => updatePreference('verifiedOnly', e.target.checked)} />
                </label>

                <label className="flex items-start justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2C3E50' }}>Compact feed layout</p>
                    <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>Reduces whitespace for faster scanning.</p>
                  </div>
                  <input type="checkbox" checked={preferences.compactFeed} onChange={(e) => updatePreference('compactFeed', e.target.checked)} />
                </label>
              </div>
            </section>

            <section className="rounded-xl border p-6" style={{ borderColor: '#E0E6ED' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#2C3E50' }}>Notifications & Safety</h2>
              <div className="space-y-5">
                <label className="flex items-start justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2C3E50' }}>Enable live ticker</p>
                    <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>Shows the live breaking-news ticker on the main feed.</p>
                  </div>
                  <input type="checkbox" checked={preferences.liveTickerEnabled} onChange={(e) => updatePreference('liveTickerEnabled', e.target.checked)} />
                </label>

                <label className="flex items-start justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2C3E50' }}>Breaking-news alerts</p>
                    <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>Prioritizes major updates across the platform.</p>
                  </div>
                  <input type="checkbox" checked={preferences.breakingAlerts} onChange={(e) => updatePreference('breakingAlerts', e.target.checked)} />
                </label>

                <label className="flex items-start justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2C3E50' }}>Safe discussions only</p>
                    <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>Keeps stricter moderation expectations for your reading experience.</p>
                  </div>
                  <input type="checkbox" checked={preferences.safeDiscussionsOnly} onChange={(e) => updatePreference('safeDiscussionsOnly', e.target.checked)} />
                </label>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Digest frequency</label>
                  <select
                    value={preferences.digestFrequency}
                    onChange={(e) => updatePreference('digestFrequency', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none"
                    style={{ borderColor: '#E0E6ED' }}
                  >
                    <option value="off">Off</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 flex-col sm:flex-row">
            <p className="text-xs" style={{ color: '#7F8C8D' }}>
              These settings are designed to influence the authenticated feed experience and are stored locally in this build.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: '#ECF0F1', color: '#2C3E50' }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: '#00B4A0' }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
