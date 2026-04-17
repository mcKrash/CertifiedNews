import Link from 'next/link';
import Image from 'next/image';

export function SiteHeader() {
  return (
    <header className="bg-[#0D1B2A] text-white py-3 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3">
          <Image src="/logo.png" alt="WCNA Logo" width={52} height={52} className="rounded" />
          <span className="text-xl font-bold tracking-tight hidden sm:inline">WCNA</span>
        </Link>
        <nav className="hidden md:flex space-x-8 font-medium">
          <Link href="/" className="hover:text-blue-400 transition-colors">Feed</Link>
          <Link href="/community" className="hover:text-blue-400 transition-colors">Community</Link>
          <Link href="/admin" className="hover:text-blue-400 transition-colors">Admin</Link>
        </nav>
        <div className="flex items-center space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#0D1B2A] text-white py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Image src="/logo.png" alt="WCNA Logo" width={40} height={40} className="rounded" />
            <h3 className="text-xl font-bold">WCNA</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            World Certified News Alliance - The global gateway for verified, traceable, and sourced news. 
            Combining professional standards with community participation.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-blue-500">Categories</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>World</li>
            <li>Politics</li>
            <li>Technology</li>
            <li>Science</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-blue-500">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>Terms of Service</li>
            <li>Privacy Policy</li>
            <li>Verification Standards</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
        © 2026 World Certified News Alliance (WCNA). All rights reserved.
      </div>
    </footer>
  );
}
