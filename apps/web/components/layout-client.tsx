'use client';

import { AuthProvider } from '../lib/auth-context';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <main className="flex-grow">
        {children}
      </main>
    </AuthProvider>
  );
}
