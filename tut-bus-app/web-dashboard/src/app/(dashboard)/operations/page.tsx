'use client';

import { Badge } from '@/components/Badge';
import { Kpi } from '@/components/Kpi';
import { IconWarning } from '@/components/icons';
import { relativeTime, metresLabel } from '@/lib/format';
import { useOperations } from '@/hooks/useOperations';

export default function OperationsPage() {
  const { fleet, deviations, sos, error, pulse, ackSos, resolveSos, clearDeviation } = useOperations();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Operations</h1>
          <p className="text-sm text-ink-muted">
            Live fleet, off-route alerts and rider SOS — refreshed every 10s
            {fleet && <span className="text-ink-dim"> · updated {relativeTime(fleet.generatedAt)}</span>}
          </p>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${pulse ? 'bg-emerald-500' : 'bg-emerald-300'}`}
          title="Live"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* SOS — most urgent, always on top */}
      {sos.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-card">
          <div className="border-b border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700">
            🆘 {sos.length} active SOS alert{sos.length > 1 ? 's' : ''}
          </div>
          <ul className="divide-y divide-red-100">
            {sos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {a.raisedBy.name ?? 'Unknown'}{' '}
                    <span className="font-normal text-ink-muted">
                      ({a.raisedBy.kind.toLowerCase()}
                      {a.raisedBy.ref ? ` · ${a.raisedBy.ref}` : ''})
                    </span>
                  </p>
                  <p className="text-xs text-ink-muted">
                    {relativeTime(a.createdAt)}
                    {a.trip?.routeName ? ` · ${a.trip.routeName}` : ''}
                    {a.raisedBy.phone ? ` · ${a.raisedBy.phone}` : ''}
                    {a.note ? ` · “${a.note}”` : ''}
                  </p>
                  {a.lat != null && a.lng != null && (
                    <a
                      className="text-xs font-medium text-accent hover:underline"
                      href={`https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=17/${a.lat}/${a.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View location ↗
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => ackSos(a.id)}
                    className="rounded-lg border border-red-300 bg-surface px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => resolveSos(a.id)}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-600"
                  >
                    Resolve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Active trips" value={fleet?.activeTripCount ?? '—'} />
        <Kpi label="Off-route" value={fleet?.openDeviationCount ?? '—'} tone={deviations.length ? 'warn' : undefined} />
        <Kpi label="Stale GPS" value={fleet?.gpsStaleCount ?? '—'} tone={fleet?.gpsStaleCount ? 'warn' : undefined} />
        <Kpi label="Active SOS" value={fleet?.activeSosCount ?? '—'} tone={sos.length ? 'alert' : undefined} />
      </div>

      {/* Off-route alerts */}
      {deviations.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-surface shadow-card">
          <div className="flex items-center gap-1.5 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700">
            <IconWarning className="h-4 w-4 shrink-0" />
            {deviations.length} bus{deviations.length > 1 ? 'es' : ''} off route
          </div>
          <ul className="divide-y divide-line/60">
            {deviations.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-ink">{d.bus.busNumber}</span>{' '}
                  <span className="text-ink-muted">
                    {d.trip.route.name} · {d.trip.driver.fullName}
                  </span>
                  <p className="text-xs text-ink-dim">
                    {metresLabel(d.distanceMeters)} off route · since {relativeTime(d.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => clearDeviation(d.id)}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-accent/[0.06]"
                >
                  Clear
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fleet wall */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-surface-inset text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Bus</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Load</th>
              <th className="px-4 py-3">Speed</th>
              <th className="px-4 py-3">GPS</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {(fleet?.buses ?? []).map((b) => (
              <tr key={b.tripId} className={b.offRoute ? 'bg-amber-50' : undefined}>
                <td className="px-4 py-3 font-medium text-ink">{b.bus.busNumber}</td>
                <td className="px-4 py-3 text-ink-muted">{b.route.name}</td>
                <td className="px-4 py-3 text-ink-muted">{b.driver.fullName}</td>
                <td className="px-4 py-3">
                  <span className="mr-2 tabular-nums text-ink-muted">
                    {b.bus.passengerCount}/{b.bus.capacity}
                  </span>
                  <Badge value={b.bus.capacityState} />
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-muted">
                  {b.bus.speedKmh != null ? `${Math.round(b.bus.speedKmh)} km/h` : '—'}
                </td>
                <td className="px-4 py-3">
                  {b.gpsStale ? (
                    <span className="text-xs font-medium text-red-700">
                      stale{b.fixAgeSeconds != null ? ` · ${b.fixAgeSeconds}s` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-dim">{b.fixAgeSeconds}s ago</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {b.offRoute ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      off route · {metresLabel(b.offRoute.distanceMeters)}
                    </span>
                  ) : (
                    <Badge value={b.tripStatus} />
                  )}
                </td>
              </tr>
            ))}
            {fleet && fleet.buses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-dim">
                  No trips in progress right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
