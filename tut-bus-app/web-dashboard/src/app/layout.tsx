import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TUT Bus App - Admin Dashboard',
  description: 'Manage buses, drivers, routes and live tracking for the TUT Bus App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
