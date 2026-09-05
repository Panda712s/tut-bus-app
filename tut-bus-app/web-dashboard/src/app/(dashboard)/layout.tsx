'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { useRequireAdmin } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useRequireAdmin();
  const pathname = usePathname();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-ink-dim">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto bg-surface-inset">
        <TopBar />
        <main className="flex-1 p-8">
          <div key={pathname} className="mx-auto max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
