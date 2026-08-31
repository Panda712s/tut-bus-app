'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useRequireAdmin } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useRequireAdmin();
  const pathname = usePathname();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div key={pathname} className="mx-auto max-w-7xl animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
