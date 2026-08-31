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
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white shadow-sm">
          T
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">TUT Bus App</p>
          <p className="text-xs text-slate-400">Admin dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <span
                className={clsx(
                  'absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-brand-600 transition-opacity duration-150',
                  active ? 'opacity-100' : 'opacity-0',
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

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          ↩ Sign out
        </button>
      </div>
    </aside>
  );
}
