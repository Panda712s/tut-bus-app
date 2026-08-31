'use client';

import { Sidebar } from '@/components/Sidebar';
import { useRequireAdmin } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useRequireAdmin();

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
    </div>
  );
}
