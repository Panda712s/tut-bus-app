'use client';

import { Badge } from '@/components/Badge';
import { relativeTime } from '@/lib/format';
import { useActivity } from '@/hooks/useActivity';

export default function ActivityPage() {
  const { logs, loading, error } = useActivity();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Activity</h1>
      <p className="mb-6 text-sm text-ink-muted">Audit trail of admin actions across the platform - who did what, and when.</p>

      {error && <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</p>}

      {loading && !error && <p className="text-ink-dim">Loading activity…</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge value={log.targetType} />
                  <span className="text-xs text-ink-dim">{log.action}</span>
                </div>
                <p className="text-sm text-ink">{log.summary}</p>
                <p className="mt-1.5 text-xs text-ink-dim">
                  {log.admin ? log.admin.fullName : 'System'}
                  {log.admin?.email ? ` (${log.admin.email})` : ''}
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-ink-dim">{relativeTime(log.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center text-ink-dim shadow-card">
              No admin activity recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
