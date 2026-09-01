'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { getNotificationsSocket } from '@/lib/socket';
import { Badge } from '@/components/Badge';
import { relativeTime, metresLabel } from '@/lib/format';
import type { FleetSnapshot, DeviationAlert, SosAlert } from '@/lib/types';

const POLL_MS = 10_000;

export default function OperationsPage() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null);
  const [deviations, setDeviations] = useState<DeviationAlert[]>([]);
  const [sos, setSos] = useState<SosAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const load = useCallback(async () => {
    try {
      const [f, d, s] = await Promise.all([
        api.get<FleetSnapshot>('/ops/fleet'),
        api.get<DeviationAlert[]>('/ops/deviations?status=OPEN'),
        api.get<SosAlert[]>('/safety/sos?status=ACTIVE'),
      ]);
      setFleet(f);
      setDeviations(d);
      setSos(s);
      setError(null);
      setPulse((p) => !p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load operations data');
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, POLL_MS);
    const sock = getNotificationsSocket();
    const bump = () => load();
    sock.on('sos:new', bump);
    sock.on('sos:updated', bump);
    sock.on('ops:deviation', bump);
    sock.on('ops:deviation-cleared', bump);
    return () => {
      if (timer.current) clearInterval(timer.current);
      sock.off('sos:new', bump);
      sock.off('sos:updated', bump);
      sock.off('ops:deviation', bump);
      sock.off('ops:deviation-cleared', bump);
    };
  }, [load]);

  async function ackSos(id: string) {
    await api.patch(`/safety/sos/${id}/acknowledge`);
    load();
  }
  async function resolveSos(id: string) {
    await api.patch(`/safety/sos/${id}/resolve`);
    load();
  }
  async function clearDeviation(id: string) {
    await api.patch(`/ops/deviations/${id}/clear`);
    load();
  }

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
          className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${pulse ? 'bg-emerald-400' : 'bg-emerald-500/40'}`}
          title="Live"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {/* SOS — most urgent, always on top */}
      {sos.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/10 shadow-card">
          <div className="border-b border-red-500/25 px-4 py-2.5 text-sm font-semibold text-red-300">
            🆘 {sos.length} active SOS alert{sos.length > 1 ? 's' : ''}
          </div>
          <ul className="divide-y divide-red-500/15">
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
                    className="rounded-lg border border-red-500/40 bg-surface px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
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
        <div className="mb-6 overflow-hidden rounded-2xl border border-amber-500/25 bg-surface shadow-card">
          <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300">
            ⚠️ {deviations.length} bus{deviations.length > 1 ? 'es' : ''} off route
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
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-white/5"
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
              <tr key={b.tripId} className={b.offRoute ? 'bg-amber-500/[0.07]' : undefined}>
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
                    <span className="text-xs font-medium text-red-300">
                      stale{b.fixAgeSeconds != null ? ` · ${b.fixAgeSeconds}s` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-dim">{b.fixAgeSeconds}s ago</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {b.offRoute ? (
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/25">
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

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'warn' | 'alert';
}) {
  const toneClass =
    tone === 'alert'
      ? 'border-red-500/25 bg-red-500/10 text-red-300'
      : tone === 'warn'
        ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
        : 'border-line bg-surface text-ink';
  return (
    <div className={`rounded-xl border p-4 shadow-card ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
