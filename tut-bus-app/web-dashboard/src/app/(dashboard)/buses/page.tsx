'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import type { Bus, Route } from '@/lib/types';

export default function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ busNumber: '', plateNumber: '', capacity: 60, currentRouteId: '' });

  function load() {
    api.get<Bus[]>('/buses').then(setBuses).catch((e) => setError(e.message));
    api.get<Route[]>('/routes').then(setRoutes).catch(() => undefined);
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/buses', {
        busNumber: form.busNumber,
        plateNumber: form.plateNumber,
        capacity: Number(form.capacity),
        currentRouteId: form.currentRouteId || undefined,
      });
      setOpen(false);
      setForm({ busNumber: '', plateNumber: '', capacity: 60, currentRouteId: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create bus');
    }
  }

  async function handleDecommission(id: string) {
    await api.patch(`/buses/${id}/decommission`);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Buses</h1>
          <p className="text-sm text-ink-muted">Fleet inventory, route assignment, and live capacity.</p>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
          + Add bus
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-surface-inset text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Bus #</th>
              <th className="px-4 py-3">Plate</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Load</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {buses.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium text-ink">{b.busNumber}</td>
                <td className="px-4 py-3 text-ink-muted">{b.plateNumber}</td>
                <td className="px-4 py-3 text-ink-muted">{b.currentRoute?.name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{b.passengerCount}/{b.capacity}</td>
                <td className="px-4 py-3"><Badge value={b.status} /></td>
                <td className="px-4 py-3"><Badge value={b.capacityState} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDecommission(b.id)} className="text-xs font-medium text-red-300 hover:underline">
                    Decommission
                  </button>
                </td>
              </tr>
            ))}
            {buses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-dim">
                  No buses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add bus">
        <form onSubmit={handleCreate}>
          <Field label="Bus number">
            <Input required value={form.busNumber} onChange={(e) => setForm({ ...form, busNumber: e.target.value })} placeholder="BUS-04" />
          </Field>
          <Field label="Plate number">
            <Input required value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} placeholder="TUT 004 GP" />
          </Field>
          <Field label="Capacity">
            <Input type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </Field>
          <Field label="Assigned route (optional)">
            <Select value={form.currentRouteId} onChange={(e) => setForm({ ...form, currentRouteId: e.target.value })}>
              <option value="">— None —</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <button type="submit" className="mt-2 w-full rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
            Create bus
          </button>
        </form>
      </Modal>
    </div>
  );
}
