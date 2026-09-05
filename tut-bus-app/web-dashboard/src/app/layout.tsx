import type { Metadata } from 'next';
import './globals.css';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'TUT Bus App - Admin Dashboard',
  description: 'Manage buses, drivers, routes and live tracking for the TUT Bus App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Runs before first paint so a returning admin's night-mode choice
            applies immediately instead of flashing day mode first. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
