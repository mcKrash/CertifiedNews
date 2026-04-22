'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PreferencesIcon } from '@/lib/icons';
import { authenticatedFetch, fetchCurrentUser, getCurrentUser } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://certifiednews.onrender.com/api';

const TOPIC_OPTIONS = ['Politics', 'Technology', 'Sports', 'Business', 'Entertainment', 'Science', 'Health', 'World News'];
const AVATAR_STYLES = ['adventurer', 'avataaars', 'bottts', 'croodles', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'notionists', 'open-peeps', 'personas', 'pixel-art'];

export default function PreferencesPage() {
  const router = useRouter();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [topicsOfInterest, setTopicsOfInterest] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState('adventurer');
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const user = (await fetchCurrentUser()) || currentUser;
      if (!user) {
        return;
      }

      setTopicsOfInterest(user.preferences?.topicsOfInterest || []);
      setPreferredLanguage(user.preferences?.preferredLanguage || 'en');

      const avatarUrl = user.avatarUrl || '';
      const matchedStyle = AVATAR_STYLES.find((style) => avatarUrl.includes(`/7.x/${style}/`));
      if (matchedStyle) {
        setSelectedAvatarStyle(matchedStyle);
      }
    };

    loadUser().catch(() => undefined);
  }, [currentUser]);

  const previewAvatarUrl = `https://api.dicebear.com/7.x/${selectedAvatarStyle}/svg?seed=${encodeURIComponent(currentUser?.email || currentUser?.username || 'wcna-user')}`;

  const toggleTopic = (topic: string) => {
    setTopicsOfInterest((prev) =>
      prev.includes(topic) ? prev.filter((item) => item !== topic) : [...prev, topic]
    );
    setSavedMessage('');
    setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    setSavedMessage('');
    setError('');

    try {
      const response = await authenticatedFetch(`${API_URL}/auth/preferences`, {
        method: 'POST',
        body: JSON.stringify({
          topicsOfInterest,
          preferredLanguage,
          avatarUrl: previewAvatarUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save preferences');
      }

      if (data?.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      setSavedMessage('Your avatar, interests, and language preferences were saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#E0E6ED', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="WCNA Logo" width={48} height={48} className="rounded" />
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#2C3E50' }}>WCNA</span>
          </Link>
          <button onClick={() => router.push('/home')} className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#00B4A0' }}>
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
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C3E50' }}>Profile Preferences</h1>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: '#7F8C8D' }}>
                Personalize your WCNA account by selecting the avatar, interests, and language that should follow your profile everywhere on the platform.
              </p>
            </div>
          </div>

          {savedMessage && (
            <div className="mb-6 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#E8F8F5', color: '#00B4A0' }}>
              {savedMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#FFE5E5', color: '#C0392B' }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border p-6" style={{ borderColor: '#E0E6ED' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#2C3E50' }}>Avatar</h2>
              <div className="flex items-center gap-4 mb-6">
                <img src={previewAvatarUrl} alt="Selected avatar" className="w-20 h-20 rounded-full border" style={{ borderColor: '#E0E6ED' }} />
                <div>
                  <p className="font-semibold" style={{ color: '#2C3E50' }}>Current avatar style</p>
                  <p className="text-sm capitalize" style={{ color: '#7F8C8D' }}>{selectedAvatarStyle}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedAvatarStyle(style)}
                    className={`p-3 rounded-xl border-2 transition ${selectedAvatarStyle === style ? 'border-[#00B4A0] bg-[#E8F8F5]' : 'border-gray-200'}`}
                  >
                    <img src={`https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(currentUser?.email || 'wcna-user')}`} alt={style} className="w-full h-20 object-contain" />
                    <p className="text-xs mt-2 capitalize" style={{ color: '#2C3E50' }}>{style}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border p-6" style={{ borderColor: '#E0E6ED' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#2C3E50' }}>Profile Reflection</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#2C3E50' }}>Topics of interest</label>
                  <div className="grid grid-cols-2 gap-3">
                    {TOPIC_OPTIONS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-4 py-3 rounded-xl border font-medium text-sm ${topicsOfInterest.includes(topic) ? 'bg-[#00B4A0] text-white border-[#00B4A0]' : 'border-gray-200 text-gray-700'}`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Preferred language</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none"
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

                <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC' }}>
                  <p className="text-sm font-semibold" style={{ color: '#2C3E50' }}>Your account type</p>
                  <p className="text-sm mt-1" style={{ color: '#7F8C8D' }}>{currentUser?.userType || 'REGULAR_USER'}</p>
                  <p className="text-xs mt-2" style={{ color: '#95A5A6' }}>
                    Your saved avatar, interests, and language will be shown through your authenticated profile and onboarding data.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button type="button" onClick={handleSave} disabled={loading} className="px-5 py-3 rounded-xl font-bold text-white disabled:opacity-60" style={{ backgroundColor: '#00B4A0' }}>
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
