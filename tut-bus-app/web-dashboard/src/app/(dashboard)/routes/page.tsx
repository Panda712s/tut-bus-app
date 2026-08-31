'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Field, Input } from '@/components/Field';
import type { Route } from '@/lib/types';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [open, setOpen] = useState(false);
  const [stopModalRoute, setStopModalRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', origin: '', destination: '', distanceKm: '', estimatedDurationMin: '' });
  const [stopForm, setStopForm] = useState({ name: '', lat: '', lng: '', order: '' });

  function load() {
    api.get<Route[]>('/routes').then(setRoutes).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/routes', {
        name: form.name,
        origin: form.origin,
        destination: form.destination,
        distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
        estimatedDurationMin: form.estimatedDurationMin ? Number(form.estimatedDurationMin) : undefined,
      });
      setOpen(false);
      setForm({ name: '', origin: '', destination: '', distanceKm: '', estimatedDurationMin: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create route');
    }
  }

  async function handleDeactivate(id: string) {
    await api.patch(`/routes/${id}/deactivate`);
    load();
  }

  async function handleAddStop(e: FormEvent) {
    e.preventDefault();
    if (!stopModalRoute) return;
    setError(null);
    try {
      await api.post('/stops', {
        routeId: stopModalRoute.id,
        name: stopForm.name,
        lat: Number(stopForm.lat),
        lng: Number(stopForm.lng),
        order: stopForm.order ? Number(stopForm.order) : undefined,
      });
      setStopForm({ name: '', lat: '', lng: '', order: '' });
      const refreshed = await api.get<Route>(`/routes/${stopModalRoute.id}`);
      setStopModalRoute(refreshed);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add stop');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Routes & Stops</h1>
          <p className="text-sm text-slate-500">The campus routes listed in the project spec, editable here.</p>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow active:scale-[0.98]">
          + Add route
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-semibold text-slate-900">{r.name}</h3>
              <span className="text-xs text-slate-400">{r._count?.buses ?? 0} buses</span>
            </div>
            <p className="text-sm text-slate-500">{r.origin} → {r.destination}</p>
            <p className="mt-1 text-xs text-slate-400">
              {r.distanceKm ? `${r.distanceKm} km` : '—'} · {r.estimatedDurationMin ? `${r.estimatedDurationMin} min` : '—'}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">{r.stops?.length ?? 0} stops</p>
            <div className="mt-4 flex gap-3 text-xs font-medium">
              <button onClick={() => setStopModalRoute(r)} className="text-brand-700 hover:underline">
                Manage stops
              </button>
              <button onClick={() => handleDeactivate(r.id)} className="text-red-600 hover:underline">
                Deactivate
              </button>
            </div>
          </div>
        ))}
        {routes.length === 0 && <p className="text-slate-400">No routes yet.</p>}
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
          <button type="submit" className="mt-2 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow active:scale-[0.98]">
            Create route
          </button>
        </form>
      </Modal>

      <Modal open={!!stopModalRoute} onClose={() => setStopModalRoute(null)} title={`Stops · ${stopModalRoute?.name ?? ''}`}>
        <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto text-sm">
          {stopModalRoute?.stops?.map((s) => (
            <li key={s.id} className="flex justify-between rounded bg-slate-50 px-2 py-1">
              <span>{s.order}. {s.name}</span>
              <span className="text-slate-400">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span>
            </li>
          ))}
          {(!stopModalRoute?.stops || stopModalRoute.stops.length === 0) && (
            <li className="text-slate-400">No stops yet.</li>
          )}
        </ul>
        <form onSubmit={handleAddStop} className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Input required placeholder="Stop name" value={stopForm.name} onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })} />
          </div>
          <Input required type="number" step="any" placeholder="Latitude" value={stopForm.lat} onChange={(e) => setStopForm({ ...stopForm, lat: e.target.value })} />
          <Input required type="number" step="any" placeholder="Longitude" value={stopForm.lng} onChange={(e) => setStopForm({ ...stopForm, lng: e.target.value })} />
          <Input type="number" placeholder="Order (optional)" value={stopForm.order} onChange={(e) => setStopForm({ ...stopForm, order: e.target.value })} />
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow active:scale-[0.98]">
            Add stop
          </button>
        </form>
      </Modal>
    </div>
  );
}
