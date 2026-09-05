'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { clearTokens, getStoredUser } from '@/lib/api';
import type { AuthUser } from '@/lib/types';
import {
  IconOverview,
  IconMap,
  IconPulse,
  IconBus,
  IconIdCard,
  IconRoute,
  IconClock,
  IconGraduationCap,
  IconBell,
  IconChat,
  IconLogout,
} from '@/components/icons';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: IconOverview },
  { href: '/live-map', label: 'Live Map', icon: IconMap },
  { href: '/operations', label: 'Operations', icon: IconPulse },
  { href: '/buses', label: 'Buses', icon: IconBus },
  { href: '/drivers', label: 'Drivers', icon: IconIdCard },
  { href: '/routes', label: 'Routes & Stops', icon: IconRoute },
  { href: '/schedules', label: 'Schedules', icon: IconClock },
  { href: '/students', label: 'Students', icon: IconGraduationCap },
  { href: '/notifications', label: 'Notifications', icon: IconBell },
  { href: '/feedback', label: 'Feedback', icon: IconChat },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser<AuthUser>());
  }, []);

  function handleLogout() {
    clearTokens();
    router.push('/login');
  }

  const initial = user?.email.trim().charAt(0).toUpperCase() || 'A';

  return (
    <aside className="glass flex h-screen w-64 shrink-0 flex-col border-r border-line/80">
      <div className="flex items-center gap-3 border-b border-line/70 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-grad text-sm font-bold text-white shadow-glow-sm">
          T
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-ink">TUT Bus App</p>
          <p className="text-[11px] uppercase tracking-wider text-ink-dim">Admin dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-accent/[0.14] text-accent shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]'
                  : 'text-ink-muted hover:bg-accent/[0.06] hover:text-ink',
              )}
            >
              <span
                className={clsx(
                  'absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent transition-all duration-200',
                  active ? 'opacity-100 shadow-[0_0_12px_0_rgb(var(--accent)/0.7)]' : 'opacity-0',
                )}
              />
              <span className="flex w-5 shrink-0 items-center justify-center transition-transform duration-150 group-hover:scale-110">
                <ItemIcon className={clsx('h-[18px] w-[18px]', active ? 'text-accent' : 'text-ink-dim')} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line/70 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-grad text-sm font-semibold text-white shadow-glow-sm">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">Administrator</p>
            <p className="truncate text-xs text-ink-dim">{user?.email ?? '—'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="shrink-0 rounded-lg p-2 text-ink-dim transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <IconLogout className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
