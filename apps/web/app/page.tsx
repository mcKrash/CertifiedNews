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
  { name: 'São Paulo', lat: -23.55, -46.63 },
  { name: 'Cairo', lat: 30.04, 31.24 },
  { name: 'Moscow', lat: 55.75, 37.62 },
  { name: 'Beijing', lat: 39.91, 116.39 },
  { name: 'Los Angeles', lat: 34.05, -118.24 },
  { name: 'Chicago', lat: 41.88, -87.63 },
  { name: 'Toronto', lat: 43.65, -79.38 },
  { name: 'Lagos', lat: 6.52, 3.38 },
  { name: 'Istanbul', lat: 41.01, 28.95 },
  { name: 'Seoul', lat: 37.57, 126.98 },
  { name: 'Jakarta', lat: -6.21, 106.85 },
  { name: 'Mexico City', lat: 19.43, -99.13 },
  { name: 'Buenos Aires', lat: -34.60, -58.38 },
  { name: 'Johannesburg', lat: -26.20, 28.04 },
  { name: 'Frankfurt', lat: 50.11, 8.68 },
  { name: 'Hong Kong', lat: 22.32, 114.17 },
  { name: 'Nairobi', lat: -1.29, 36.82 }
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

// Simplified continent outlines
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

  // --- Globe Animation Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 340;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const R = size / 2 - 20;
    const cx = size / 2;
    const cy = size / 2;

    // Precompute routes
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
        const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lon = Math.atan2(y, x);
        points.push({ lat, lon });
      }
      return { points, offset: Math.random() };
    });

    const animate = () => {
      const now = Date.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      if (!isPaused) {
        rotationRef.current += 0.010 * dt;
      }
      const rotRad = (rotationRef.current * Math.PI) / 180;

      ctx.clearRect(0, 0, size, size);

      // 1. Radial Glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.12);
      glow.addColorStop(0, 'rgba(0,184,160,0.14)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
      ctx.fill();

      // 2. Ocean
      const ocean = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      ocean.addColorStop(0, 'rgba(210,245,241,0.7)');
      ocean.addColorStop(1, 'rgba(160,220,215,0.4)');
      ctx.fillStyle = ocean;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // 3. Border
      ctx.strokeStyle = 'rgba(0,184,160,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // 4. Latitude lines
      for (let lat = -75; lat <= 75; lat += 15) {
        const y = cy - R * Math.sin(lat * Math.PI / 180);
        const rx = R * Math.cos(lat * Math.PI / 180);
        ctx.beginPath();
        ctx.ellipse(cx, y, rx, rx * 0.18, 0, 0, Math.PI * 2);
        ctx.strokeStyle = lat === 0 ? 'rgba(0,184,160,0.35)' : 'rgba(0,184,160,0.12)';
        ctx.lineWidth = lat === 0 ? 1 : 0.6;
        ctx.stroke();
      }

      // 5. Longitude lines
      for (let lon = 0; lon < 360; lon += 15) {
        const lambda = (lon + rotationRef.current) * Math.PI / 180;
        if (Math.cos(lambda) > -0.15) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(Math.cos(lambda), 1);
          ctx.beginPath();
          ctx.arc(0, 0, R, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0,184,160,0.12)';
          ctx.lineWidth = 0.6;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 6. Continents
      ctx.fillStyle = 'rgba(0,160,140,0.38)';
      ctx.strokeStyle = 'rgba(0,180,155,0.5)';
      ctx.lineWidth = 0.7;
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
        ctx.fill();
        ctx.stroke();
      });

      // 7. Routes & Packets
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
          } else {
            started = false;
          }
        });
        ctx.strokeStyle = 'rgba(0,200,170,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Packet
        const progress = (route.offset + (now / 1000) * 0.08) % 1;
        const idx = progress * (route.points.length - 1);
        const i1 = Math.floor(idx);
        const i2 = Math.ceil(idx);
        const f = idx - i1;
        const p1 = route.points[i1];
        const p2 = route.points[i2];
        const lat = p1.lat + (p2.lat - p1.lat) * f;
        const lon = p1.lon + (p2.lon - p1.lon) * f;
        const z = R * Math.cos(lat) * Math.sin(lon + rotRad);
        if (z > 0) {
          const sx = cx + R * Math.cos(lat) * Math.cos(lon + rotRad);
          const sy = cy - R * Math.sin(lat);
          const packetGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6);
          packetGlow.addColorStop(0, 'rgba(0,220,180,0.95)');
          packetGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = packetGlow;
          ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'white';
          ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, Math.PI * 2); ctx.fill();
        }
      });

      // 8. Cities
      CITIES.forEach(city => {
        const latRad = city.lat * Math.PI / 180;
        const lonRad = city.lon * Math.PI / 180;
        const z = R * Math.cos(latRad) * Math.sin(lonRad + rotRad);
        if (z > 0) {
          const brightness = z / R;
          const sx = cx + R * Math.cos(latRad) * Math.cos(lonRad + rotRad);
          const sy = cy - R * Math.sin(latRad);
          const r = 2.2 + brightness * 1.5;
          ctx.strokeStyle = `rgba(0,200,170,${brightness * 0.4})`;
          ctx.beginPath(); ctx.arc(sx, sy, r + 4, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(0,190,160,${0.55 + brightness * 0.45})`;
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${brightness * 0.6})`;
          ctx.beginPath(); ctx.arc(sx - r * 0.3, sy - r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.fill();
        }
      });

      ctx.restore();
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isPaused]);

  // --- Auth Handlers ---
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
      setError('Google login is not configured yet.');
      return;
    }
    const canonicalOrigin = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace('://www.', '://');
    const redirectUri = `${canonicalOrigin}/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid profile email')}&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scaleIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
      `}</style>

      {/* Left Panel - Globe */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center p-8 border-r" style={{ background: 'linear-gradient(135deg, #f0fdfb 0%, #ccf2ef 100%)', borderColor: '#e0e6ed' }}>
        <div className="animate-scale-in">
          <canvas ref={canvasRef} style={{ width: 340, height: 340 }} />
        </div>
        
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <h1 className="text-[19px] font-semibold mb-1" style={{ color: '#2c3e50' }}>World Certified News Alliance</h1>
          <p className="text-[13px]" style={{ color: '#7f8c8d' }}>Where We Make Sure It&apos;s Certified.</p>
        </div>

        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="absolute bottom-8 right-8 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-full bg-white/50 hover:bg-white transition-colors"
          style={{ color: '#2c3e50' }}
        >
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-gray-400' : 'bg-[#00b8a0]'}`} style={{ boxShadow: isPaused ? 'none' : '0 0 8px rgba(0,184,160,0.6)' }} />
          {isPaused ? 'Resume motion' : 'Pause motion'}
        </button>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px] animate-fade-in" style={{ transform: 'translateY(24px)' }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 opacity-0 animate-fade-in stagger-1">
            <div className="w-12 h-12 relative flex items-center justify-center rounded-lg mb-2" style={{ background: 'linear-gradient(to bottom, #1a3a4a, #0d2b3a)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00b8a0" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <ellipse cx="12" cy="12" rx="4" ry="9" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <path d="M12 3a30 30 0 0 0 0 18" />
              </svg>
            </div>
            <span className="text-[10px] font-serif tracking-widest text-[#1a3a4a]">WCNA</span>
          </div>

          <div className="text-center mb-8 opacity-0 animate-fade-in stagger-2">
            <h2 className="text-[25px] font-bold mb-1" style={{ color: '#1a2c3a', letterSpacing: '-0.4px' }}>Welcome Back</h2>
            <p className="text-[14px]" style={{ color: '#8a9aaa' }}>Sign in to your account</p>
          </div>

          {message && <div className="p-3 rounded-lg text-sm mb-4" style={{ backgroundColor: '#E8F8F5', color: '#00B4A0' }}>{message}</div>}
          {error && <div className="p-3 rounded-lg text-sm mb-4" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C' }}>{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4 mb-6 opacity-0 animate-fade-in stagger-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Username or email"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full px-4 py-3 border-[1.5px] rounded-[10px] text-sm transition-all focus:outline-none focus:border-[#00b8a0] focus:ring-[3px] focus:ring-[#00b8a0]/10"
                style={{ borderColor: '#dde3ea' }}
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-[1.5px] rounded-[10px] text-sm transition-all focus:outline-none focus:border-[#00b8a0] focus:ring-[3px] focus:ring-[#00b8a0]/10"
                style={{ borderColor: '#dde3ea' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a9aaa] hover:text-[#2c3e50]"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[13px] rounded-[10px] font-bold text-white transition-all hover:translate-y-[-1px] active:translate-y-[0] disabled:opacity-50"
              style={{ 
                background: 'linear-gradient(to right, #00c9af, #00b8a0)',
                boxShadow: '0 4px 20px rgba(0,184,160,0.35)'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative mb-6 opacity-0 animate-fade-in stagger-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#e8edf2' }}></div>
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="px-2 bg-white text-[#aab4be]">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3 opacity-0 animate-fade-in stagger-5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 border-[1.5px] rounded-[10px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all hover:shadow-sm"
              style={{ borderColor: '#e0e6ed', color: '#1a2c3a' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <Link
              href="/auth/register"
              className="block w-full py-3 border-[1.5px] rounded-[10px] font-bold text-center hover:bg-gray-50 transition-all hover:shadow-sm"
              style={{ borderColor: '#e0e6ed', color: '#1a2c3a' }}
            >
              Create Account
            </Link>
          </div>

          <p className="text-center text-[14px] mt-8 opacity-0 animate-fade-in stagger-5" style={{ color: '#8a9aaa' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={{ color: '#00b8a0', fontWeight: 'bold' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
