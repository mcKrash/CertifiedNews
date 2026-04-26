'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loginUser } from '@/lib/auth';
import { EyeIcon, EyeOffIcon } from '@/lib/icons';

// --- Constants for Globe ---
const CITIES = [
  { name: 'New York', lat: 40.71, lon: -74.0 },
  { name: 'London', lat: 51.51, lon: -0.13 },
  { name: 'Paris', lat: 48.85, lon: 2.35 },
  { name: 'Tokyo', lat: 35.68, lon: 139.69 },
  { name: 'Sydney', lat: -33.87, lon: 151.21 },
  { name: 'Dubai', lat: 25.20, lon: 55.27 },
  { name: 'Singapore', lat: 1.35, lon: 103.82 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'São Paulo', lat: -23.55, lon: -46.63 },
  { name: 'Cairo', lat: 30.04, lon: 31.24 },
  { name: 'Moscow', lat: 55.75, lon: 37.62 },
  { name: 'Beijing', lat: 39.91, lon: 116.39 },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
  { name: 'Chicago', lat: 41.88, lon: -87.63 },
  { name: 'Toronto', lat: 43.65, lon: -79.38 },
  { name: 'Lagos', lat: 6.52, lon: 3.38 },
  { name: 'Istanbul', lat: 41.01, lon: 28.95 },
  { name: 'Seoul', lat: 37.57, lon: 126.98 },
  { name: 'Jakarta', lat: -6.21, lon: 106.85 },
  { name: 'Mexico City', lat: 19.43, lon: -99.13 },
  { name: 'Buenos Aires', lat: -34.60, lon: -58.38 },
  { name: 'Johannesburg', lat: -26.20, lon: 28.04 },
  { name: 'Frankfurt', lat: 50.11, lon: 8.68 },
  { name: 'Hong Kong', lat: 22.32, lon: 114.17 },
  { name: 'Nairobi', lat: -1.29, lon: 36.82 }
];

const ROUTES = [
  ['New York', 'London'], ['London', 'Paris'], ['New York', 'Los Angeles'], 
  ['Tokyo', 'Hong Kong'], ['London', 'Istanbul'], ['Sydney', 'Tokyo'],
  ['Cairo', 'Lagos'], ['Moscow', 'Beijing'], ['Dubai', 'Mumbai'],
  ['Singapore', 'Jakarta'], ['Paris', 'Johannesburg'], ['Chicago', 'Cairo'],
  ['Buenos Aires', 'London'], ['Toronto', 'New York'], ['Mumbai', 'Nairobi'],
  ['Tokyo', 'Seoul'], ['Beijing', 'Tokyo'], ['São Paulo', 'New York'],
  ['Paris', 'Moscow'], ['Lagos', 'Cairo'], ['Singapore', 'Mumbai'],
  ['London', 'Dubai'], ['Los Angeles', 'Mexico City']
];

const CONTINENTS = {
  northAmerica: [[45,-100], [60,-110], [70,-120], [75,-100], [70,-80], [60,-70], [45,-70], [30,-80], [20,-90], [25,-100]],
  southAmerica: [[10,-75], [10,-50], [-20,-40], [-50,-65], [-35,-80], [0,-80]],
  europe: [[60,10], [65,30], [50,40], [40,30], [35,10], [45,0]],
  africa: [[30,10], [30,30], [15,45], [-10,40], [-35,20], [-10,-10], [15,-10]],
  asia: [[70,80], [70,120], [50,140], [20,120], [10,100], [20,60], [40,60]],
  australia: [[-15,120], [-15,150], [-35,150], [-35,120]],
  greenland: [[75,-40], [80,-30], [70,-20], [70,-50]],
};

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const requestRef = useRef<number>();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const googleEnabled = useMemo(() => Boolean(googleClientId), [googleClientId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 500;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const R = size / 2 - 30;
    const cx = size / 2;
    const cy = size / 2;

    const precomputedRoutes = ROUTES.map(([fromName, toName]) => {
      const from = CITIES.find(c => c.name === fromName)!;
      const to = CITIES.find(c => c.name === toName)!;
      const points = [];
      const steps = 48;
      const lat1 = from.lat * Math.PI / 180;
      const lon1 = from.lon * Math.PI / 180;
      const lat2 = to.lat * Math.PI / 180;
      const lon2 = to.lon * Math.PI / 180;
      const d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = Math.sin((1 - t) * d) / Math.sin(d);
        const b = Math.sin(t * d) / Math.sin(d);
        const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
        const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
        const z = a * Math.sin(lat1) + b * Math.sin(lat2);
        points.push({ lat: Math.atan2(z, Math.sqrt(x * x + y * y)), lon: Math.atan2(y, x) });
      }
      return { points, offset: Math.random() };
    });

    const animate = () => {
      const now = Date.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      if (!isPaused) rotationRef.current += 0.010 * dt;
      const rotRad = (rotationRef.current * Math.PI) / 180;

      ctx.clearRect(0, 0, size, size);
      const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.15);
      glow.addColorStop(0, 'rgba(0,184,160,0.18)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2); ctx.fill();

      const ocean = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      ocean.addColorStop(0, 'rgba(210,245,241,0.8)');
      ocean.addColorStop(1, 'rgba(160,220,215,0.5)');
      ctx.fillStyle = ocean;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

      for (let lat = -75; lat <= 75; lat += 15) {
        const y = cy - R * Math.sin(lat * Math.PI / 180);
        const rx = R * Math.cos(lat * Math.PI / 180);
        ctx.beginPath(); ctx.ellipse(cx, y, rx, rx * 0.18, 0, 0, Math.PI * 2);
        ctx.strokeStyle = lat === 0 ? 'rgba(0,184,160,0.4)' : 'rgba(0,184,160,0.15)';
        ctx.lineWidth = lat === 0 ? 1 : 0.6; ctx.stroke();
      }

      ctx.fillStyle = 'rgba(0,160,140,0.45)';
      ctx.strokeStyle = 'rgba(0,180,155,0.6)';
      ctx.lineWidth = 0.8;
      Object.values(CONTINENTS).forEach(poly => {
        ctx.beginPath();
        let first = true;
        poly.forEach(([lat, lon]) => {
          const latRad = lat * Math.PI / 180;
          const lonRad = lon * Math.PI / 180;
          const z = R * Math.cos(latRad) * Math.sin(lonRad + rotRad);
          if (z > -R * 0.1) {
            const sx = cx + R * Math.cos(latRad) * Math.cos(lonRad + rotRad);
            const sy = cy - R * Math.sin(latRad);
            if (first) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
            first = false;
          }
        });
        ctx.fill(); ctx.stroke();
      });

      precomputedRoutes.forEach(route => {
        ctx.beginPath();
        let started = false;
        route.points.forEach(p => {
          const z = R * Math.cos(p.lat) * Math.sin(p.lon + rotRad);
          if (z > 0) {
            const sx = cx + R * Math.cos(p.lat) * Math.cos(p.lon + rotRad);
            const sy = cy - R * Math.sin(p.lat);
            if (!started) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
            started = true;
          } else started = false;
        });
        ctx.strokeStyle = 'rgba(0,200,170,0.25)'; ctx.lineWidth = 1; ctx.stroke();

        const progress = (route.offset + (now / 1000) * 0.08) % 1;
        const idx = progress * (route.points.length - 1);
        const p1 = route.points[Math.floor(idx)], p2 = route.points[Math.ceil(idx)];
        const f = idx - Math.floor(idx);
        const lat = p1.lat + (p2.lat - p1.lat) * f, lon = p1.lon + (p2.lon - p1.lon) * f;
        const z = R * Math.cos(lat) * Math.sin(lon + rotRad);
        if (z > 0) {
          const sx = cx + R * Math.cos(lat) * Math.cos(lon + rotRad), sy = cy - R * Math.sin(lat);
          const packetGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 7);
          packetGlow.addColorStop(0, 'rgba(0,220,180,1)');
          packetGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = packetGlow; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
        }
      });

      CITIES.forEach(city => {
        const latRad = city.lat * Math.PI / 180, lonRad = city.lon * Math.PI / 180;
        const z = R * Math.cos(latRad) * Math.sin(lonRad + rotRad);
        if (z > 0) {
          const brightness = z / R, sx = cx + R * Math.cos(latRad) * Math.cos(lonRad + rotRad), sy = cy - R * Math.sin(latRad);
          const r = 2.5 + brightness * 1.5;
          ctx.strokeStyle = `rgba(0,200,170,${brightness * 0.5})`;
          ctx.beginPath(); ctx.arc(sx, sy, r + 5, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(0,190,160,${0.6 + brightness * 0.4})`;
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
        }
      });

      ctx.restore();
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isPaused]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginUser(emailOrUsername, password);
      window.location.href = '/home';
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!googleEnabled) { setError('Google login not configured.'); return; }
    const canonicalOrigin = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace('://www.', '://');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(`${canonicalOrigin}/auth/google/callback`)}&response_type=code&scope=${encodeURIComponent('openid profile email')}&prompt=select_account`;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0fdfb 0%, #ccf2ef 100%)' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scaleIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .font-elegant { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Left Panel - Globe */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center p-8">
        <div className="animate-scale-in">
          <canvas ref={canvasRef} style={{ width: 500, height: 500 }} className="max-w-full h-auto" />
        </div>
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <h1 className="text-[32px] font-elegant mb-3" style={{ color: '#1a2c3a', letterSpacing: '-0.02em' }}>World Certified News Alliance</h1>
          <p className="text-[17px] font-inter italic" style={{ color: '#5a6a7a', fontWeight: 400 }}>Where We Make Sure It&apos;s Certified.</p>
        </div>
        <button onClick={() => setIsPaused(!isPaused)} className="absolute bottom-8 left-8 flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-white/60 hover:bg-white transition-all shadow-sm" style={{ color: '#2c3e50' }}>
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-gray-400' : 'bg-[#00b8a0]'}`} style={{ boxShadow: isPaused ? 'none' : '0 0 8px rgba(0,184,160,0.6)' }} />
          {isPaused ? 'Resume motion' : 'Pause motion'}
        </button>
      </div>

      {/* Right Panel - Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-md p-10 rounded-[32px] shadow-2xl animate-fade-in border border-white/40">
          <div className="flex flex-col items-center mb-10">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <Image src="/logo.png" alt="WCNA Logo" width={90} height={90} className="rounded-2xl shadow-lg" />
            </div>
            <h2 className="text-[30px] font-inter font-bold mb-1" style={{ color: '#1a2c3a', letterSpacing: '-0.03em' }}>Welcome Back</h2>
            <p className="text-[15px] font-inter" style={{ color: '#8a9aaa', fontWeight: 500 }}>Sign in to your account</p>
          </div>

          {message && <div className="p-4 rounded-xl text-sm mb-6 font-inter" style={{ backgroundColor: '#E8F8F5', color: '#00B4A0' }}>{message}</div>}
          {error && <div className="p-4 rounded-xl text-sm mb-6 font-inter" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C' }}>{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5 mb-8">
            <input type="text" placeholder="Username or email" value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} className="w-full px-5 py-4 border-[1.5px] rounded-[16px] text-sm font-inter transition-all focus:outline-none focus:border-[#00b8a0] focus:ring-[4px] focus:ring-[#00b8a0]/10" style={{ borderColor: '#dde3ea' }} required />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 border-[1.5px] rounded-[16px] text-sm font-inter transition-all focus:outline-none focus:border-[#00b8a0] focus:ring-[4px] focus:ring-[#00b8a0]/10" style={{ borderColor: '#dde3ea' }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8a9aaa] hover:text-[#2c3e50]">{showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}</button>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-[16px] font-inter font-bold text-white transition-all hover:translate-y-[-2px] active:translate-y-[0] disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00c9af, #00b8a0)', boxShadow: '0 8px 24px rgba(0,184,160,0.3)' }}>{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: '#e8edf2' }}></div></div>
            <div className="relative flex justify-center text-[13px]"><span className="px-4 bg-white/0 text-[#aab4be] font-inter font-medium">Or continue with</span></div>
          </div>

          <div className="space-y-4">
            <button type="button" onClick={handleGoogleLogin} className="w-full py-4 border-[1.5px] rounded-[16px] font-inter font-bold flex items-center justify-center gap-3 hover:bg-white transition-all hover:shadow-md" style={{ borderColor: '#e0e6ed', color: '#1a2c3a' }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </button>
          </div>

          <p className="text-center text-[15px] font-inter mt-10" style={{ color: '#8a9aaa', fontWeight: 500 }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="transition-colors hover:text-[#009985]" style={{ color: '#00b8a0', fontWeight: 'bold' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
