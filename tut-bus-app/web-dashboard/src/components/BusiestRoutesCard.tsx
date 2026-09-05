import type { BusiestRoute } from '@/hooks/useOverview';
import { IconDownload } from '@/components/icons';

export function BusiestRoutesCard({ routes, onExport }: { routes: BusiestRoute[]; onExport?: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Busiest routes</h2>
        {onExport && (
          <button
            onClick={onExport}
            disabled={routes.length === 0}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:text-ink-dim disabled:no-underline"
          >
            <IconDownload className="h-3.5 w-3.5" />
            Export CSV
          </button>
        )}
      </div>
      <ul className="space-y-3">
        {routes.map((r) => (
          <li key={r.name} className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">{r.name}</span>
            <span className="font-semibold text-ink">{r.tripCount}</span>
          </li>
        ))}
        {routes.length === 0 && <p className="text-sm text-ink-dim">No trip data yet.</p>}
      </ul>
    </div>
  );
}
