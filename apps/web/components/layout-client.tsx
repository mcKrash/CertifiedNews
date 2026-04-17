'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '../lib/auth-context';
import { SiteHeader, SiteFooter } from './site-shell';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show header/footer on login, register, and auth pages
  const isAuthPage = pathname === '/' || pathname.startsWith('/auth/') || pathname === '/home';
  
  return (
    <AuthProvider>
      {!isAuthPage && <SiteHeader />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAuthPage && <SiteFooter />}
    </AuthProvider>
  );
}
