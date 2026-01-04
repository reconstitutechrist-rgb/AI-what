'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Development auth bypass - set NEXT_PUBLIC_DEV_BYPASS_AUTH=true in .env.local for testing
const DEV_BYPASS_AUTH =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip auth check in dev mode with bypass enabled
    if (DEV_BYPASS_AUTH) {
      setIsChecking(false);
      return;
    }

    // Wait for auth context to finish loading
    if (!loading) {
      if (!user) {
        router.push('/login');
      }
      setIsChecking(false);
    }
  }, [pathname, router, user, loading]);

  // Show loading state while checking auth (skip if dev bypass enabled)
  if (!DEV_BYPASS_AUTH && (isChecking || loading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-garden-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div style={{ color: 'var(--text-primary)' }} className="text-lg">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Require authentication (skip if dev bypass enabled)
  if (!DEV_BYPASS_AUTH && !user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {children}
    </div>
  );
}
