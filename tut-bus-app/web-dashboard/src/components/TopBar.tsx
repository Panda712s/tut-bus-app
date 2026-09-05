'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

const SECTION_LABELS: Record<string, string> = {
  '/': 'Overview',
  '/live-map': 'Live Map',
  '/operations': 'Operations',
  '/buses': 'Buses',
  '/drivers': 'Drivers',
  '/routes': 'Routes & Stops',
  '/schedules': 'Schedules',
  '/students': 'Students',
  '/notifications': 'Notifications',
  '/feedback': 'Feedback',
};

/** Slim utility strip above the page content: orientation (section · date) on
 * the left, a live-system indicator on the right. Deliberately doesn't repeat
 * each page's own heading/description — this is chrome, not content. */
export function TopBar() {
  const pathname = usePathname();
  const section = SECTION_LABELS[pathname] ?? 'Dashboard';
  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="glass sticky top-0 z-10 flex items-center justify-between border-b border-line/70 px-8 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-ink">{section}</span>
        <span className="text-ink-dim/60" aria-hidden>
          ·
        </span>
        <span className="text-ink-dim">{today}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-400/25">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          System live
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
