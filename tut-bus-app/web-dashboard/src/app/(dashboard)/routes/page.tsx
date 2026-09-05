'use client';

import { FormEvent, useState } from 'react';
import { ApiError } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Field, Input } from '@/components/Field';
import { useRoutes } from '@/hooks/useRoutes';
import type { Route } from '@/lib/types';

export default function RoutesPage() {
  const { routes, error, setError, create, deactivate, addStop } = useRoutes();
  const [open, setOpen] = useState(false);
  const [stopModalRoute, setStopModalRoute] = useState<Route | null>(null);
  const [form, setForm] = useState({ name: '', origin: '', destination: '', distanceKm: '', estimatedDurationMin: '' });
  const [stopForm, setStopForm] = useState({ name: '', lat: '', lng: '', order: '' });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create({
        name: form.name,
        origin: form.origin,
        destination: form.destination,
        distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
        estimatedDurationMin: form.estimatedDurationMin ? Number(form.estimatedDurationMin) : undefined,
      });
      setOpen(false);
      setForm({ name: '', origin: '', destination: '', distanceKm: '', estimatedDurationMin: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create route');
    }
  }

  async function handleDeactivate(id: string) {
    await deactivate(id);
  }

  async function handleAddStop(e: FormEvent) {
    e.preventDefault();
    if (!stopModalRoute) return;
    setError(null);
    try {
      const refreshed = await addStop({
        routeId: stopModalRoute.id,
        name: stopForm.name,
        lat: Number(stopForm.lat),
        lng: Number(stopForm.lng),
        order: stopForm.order ? Number(stopForm.order) : undefined,
      });
      setStopForm({ name: '', lat: '', lng: '', order: '' });
      setStopModalRoute(refreshed);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add stop');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Routes & Stops</h1>
          <p className="text-sm text-ink-muted">The campus routes listed in the project spec, editable here.</p>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
          + Add route
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((r) => (
          <div key={r.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-semibold text-ink">{r.name}</h3>
              <span className="text-xs text-ink-dim">{r._count?.buses ?? 0} buses</span>
            </div>
            <p className="text-sm text-ink-muted">{r.origin} → {r.destination}</p>
            <p className="mt-1 text-xs text-ink-dim">
              {r.distanceKm ? `${r.distanceKm} km` : '—'} · {r.estimatedDurationMin ? `${r.estimatedDurationMin} min` : '—'}
            </p>
            <p className="mt-2 text-xs font-medium text-ink-muted">{r.stops?.length ?? 0} stops</p>
            <div className="mt-4 flex gap-3 text-xs font-medium">
              <button onClick={() => setStopModalRoute(r)} className="text-accent hover:underline">
                Manage stops
              </button>
              <button onClick={() => handleDeactivate(r.id)} className="text-red-700 dark:text-red-400 hover:underline">
                Deactivate
              </button>
            </div>
          </div>
        ))}
        {routes.length === 0 && <p className="text-ink-dim">No routes yet.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add route">
        <form onSubmit={handleCreate}>
          <Field label="Route name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Arcadia Route" />
          </Field>
          <Field label="Origin">
            <Input required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
          </Field>
          <Field label="Destination">
            <Input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </Field>
          <Field label="Distance (km, optional)">
            <Input type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} />
          </Field>
          <Field label="Estimated duration (minutes, optional)">
            <Input type="number" value={form.estimatedDurationMin} onChange={(e) => setForm({ ...form, estimatedDurationMin: e.target.value })} />
          </Field>
          <button type="submit" className="mt-2 w-full rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
            Create route
          </button>
        </form>
      </Modal>

      <Modal open={!!stopModalRoute} onClose={() => setStopModalRoute(null)} title={`Stops · ${stopModalRoute?.name ?? ''}`}>
        <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto text-sm">
          {stopModalRoute?.stops?.map((s) => (
            <li key={s.id} className="flex justify-between rounded bg-surface-inset px-2 py-1">
              <span>{s.order}. {s.name}</span>
              <span className="text-ink-dim">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span>
            </li>
          ))}
          {(!stopModalRoute?.stops || stopModalRoute.stops.length === 0) && (
            <li className="text-ink-dim">No stops yet.</li>
          )}
        </ul>
        <form onSubmit={handleAddStop} className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Input required placeholder="Stop name" value={stopForm.name} onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })} />
          </div>
          <Input required type="number" step="any" placeholder="Latitude" value={stopForm.lat} onChange={(e) => setStopForm({ ...stopForm, lat: e.target.value })} />
          <Input required type="number" step="any" placeholder="Longitude" value={stopForm.lng} onChange={(e) => setStopForm({ ...stopForm, lng: e.target.value })} />
          <Input type="number" placeholder="Order (optional)" value={stopForm.order} onChange={(e) => setStopForm({ ...stopForm, order: e.target.value })} />
          <button type="submit" className="rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
            Add stop
          </button>
        </form>
      </Modal>
    </div>
  );
}
