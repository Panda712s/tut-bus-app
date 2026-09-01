'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { clearTokens } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/live-map', label: 'Live Map', icon: '🗺️' },
  { href: '/operations', label: 'Operations', icon: '🛰️' },
  { href: '/buses', label: 'Buses', icon: '🚌' },
  { href: '/drivers', label: 'Drivers', icon: '🧑‍✈️' },
  { href: '/routes', label: 'Routes & Stops', icon: '🛣️' },
  { href: '/schedules', label: 'Schedules', icon: '🕒' },
  { href: '/students', label: 'Students', icon: '🎓' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/feedback', label: 'Feedback', icon: '💬' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearTokens();
    router.push('/login');
  }

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
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-accent/[0.14] text-accent shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]'
                  : 'text-ink-muted hover:bg-white/[0.04] hover:text-ink',
              )}
            >
              <span
                className={clsx(
                  'absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent transition-all duration-200',
                  active ? 'opacity-100 shadow-[0_0_12px_0_rgb(var(--accent)/0.7)]' : 'opacity-0',
                )}
              />
              <span className="w-5 text-center text-base transition-transform duration-150 group-hover:scale-110">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line/70 p-3">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
        >
          ↩ Sign out
        </button>
      </div>
    </aside>
  );
}
