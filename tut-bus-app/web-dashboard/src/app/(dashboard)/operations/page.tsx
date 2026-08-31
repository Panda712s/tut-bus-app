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
          <h1 className="text-2xl font-semibold text-slate-900">Operations</h1>
          <p className="text-sm text-slate-500">
            Live fleet, off-route alerts and rider SOS — refreshed every 10s
            {fleet && <span className="text-slate-400"> · updated {relativeTime(fleet.generatedAt)}</span>}
          </p>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${pulse ? 'bg-green-500' : 'bg-green-300'}`}
          title="Live"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* SOS — most urgent, always on top */}
      {sos.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-red-200 bg-red-50 shadow-card">
          <div className="border-b border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700">
            🆘 {sos.length} active SOS alert{sos.length > 1 ? 's' : ''}
          </div>
          <ul className="divide-y divide-red-100">
            {sos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {a.raisedBy.name ?? 'Unknown'}{' '}
                    <span className="font-normal text-slate-500">
                      ({a.raisedBy.kind.toLowerCase()}
                      {a.raisedBy.ref ? ` · ${a.raisedBy.ref}` : ''})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {relativeTime(a.createdAt)}
                    {a.trip?.routeName ? ` · ${a.trip.routeName}` : ''}
                    {a.raisedBy.phone ? ` · ${a.raisedBy.phone}` : ''}
                    {a.note ? ` · “${a.note}”` : ''}
                  </p>
                  {a.lat != null && a.lng != null && (
                    <a
                      className="text-xs font-medium text-brand-700 hover:underline"
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
                    className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => resolveSos(a.id)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
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
        <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-card">
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
            ⚠️ {deviations.length} bus{deviations.length > 1 ? 'es' : ''} off route
          </div>
          <ul className="divide-y divide-slate-100">
            {deviations.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-slate-900">{d.bus.busNumber}</span>{' '}
                  <span className="text-slate-500">
                    {d.trip.route.name} · {d.trip.driver.fullName}
                  </span>
                  <p className="text-xs text-slate-400">
                    {metresLabel(d.distanceMeters)} off route · since {relativeTime(d.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => clearDeviation(d.id)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Clear
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fleet wall */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
          <tbody className="divide-y divide-slate-100">
            {(fleet?.buses ?? []).map((b) => (
              <tr key={b.tripId} className={b.offRoute ? 'bg-amber-50/50' : undefined}>
                <td className="px-4 py-3 font-medium text-slate-900">{b.bus.busNumber}</td>
                <td className="px-4 py-3 text-slate-600">{b.route.name}</td>
                <td className="px-4 py-3 text-slate-600">{b.driver.fullName}</td>
                <td className="px-4 py-3">
                  <span className="mr-2 tabular-nums text-slate-600">
                    {b.bus.passengerCount}/{b.bus.capacity}
                  </span>
                  <Badge value={b.bus.capacityState} />
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-600">
                  {b.bus.speedKmh != null ? `${Math.round(b.bus.speedKmh)} km/h` : '—'}
                </td>
                <td className="px-4 py-3">
                  {b.gpsStale ? (
                    <span className="text-xs font-medium text-red-600">
                      stale{b.fixAgeSeconds != null ? ` · ${b.fixAgeSeconds}s` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">{b.fixAgeSeconds}s ago</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {b.offRoute ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
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
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
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
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-white text-slate-900';
  return (
    <div className={`rounded-xl border p-4 shadow-card ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
