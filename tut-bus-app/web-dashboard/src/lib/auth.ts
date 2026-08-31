'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from './api';
import type { AuthUser } from './types';

/** Client-side guard for dashboard pages: redirects to /login if no admin session is stored. */
export function useRequireAdmin(): AuthUser | null {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser<AuthUser>();
    if (!stored || stored.role !== 'ADMIN') {
      router.replace('/login');
      return;
    }
    setUser(stored);
  }, [router]);

  return user;
}
