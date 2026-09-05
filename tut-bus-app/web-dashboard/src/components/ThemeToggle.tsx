'use client';

import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme';
import { IconSun, IconMoon } from '@/components/icons';

/** Day/night switch for the admin dashboard. Defaults to day mode and only
 * switches when the admin asks — it doesn't follow the OS preference, so the
 * choice sticks the same way across whatever machine they sign in on. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  const label = theme === 'dark' ? 'Switch to day mode' : 'Switch to night mode';

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-accent/[0.08] hover:text-ink"
    >
      {theme === 'dark' ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
    </button>
  );
}
