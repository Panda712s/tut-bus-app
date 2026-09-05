import type { BusiestRoute } from '@/hooks/useOverview';

export function BusiestRoutesCard({ routes }: { routes: BusiestRoute[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-ink">Busiest routes</h2>
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
