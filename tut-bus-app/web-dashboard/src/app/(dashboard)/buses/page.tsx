'use client';

import { FormEvent, useState } from 'react';
import { ApiError } from '@/lib/api';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { useBuses } from '@/hooks/useBuses';

export default function BusesPage() {
  const { buses, routes, drivers, error, setError, create, decommission, recommission } = useBuses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ busNumber: '', plateNumber: '', capacity: 60, currentRouteId: '' });

  function driverFor(busId: string) {
    return drivers.find((d) => d.isActive && d.assignedBusId === busId) ?? null;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create({
        busNumber: form.busNumber,
        plateNumber: form.plateNumber,
        capacity: Number(form.capacity),
        currentRouteId: form.currentRouteId || undefined,
      });
      setOpen(false);
      setForm({ busNumber: '', plateNumber: '', capacity: 60, currentRouteId: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create bus');
    }
  }

  async function handleDecommission(id: string) {
    await decommission(id);
  }

  async function handleRecommission(id: string) {
    await recommission(id);
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

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-surface-inset text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Bus #</th>
              <th className="px-4 py-3">Plate</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Driver</th>
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
                <td className="px-4 py-3">
                  {driverFor(b.id) ? (
                    <span className="text-ink-muted">{driverFor(b.id)!.fullName}</span>
                  ) : (
                    <span className="text-ink-dim">No driver assigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{b.passengerCount}/{b.capacity}</td>
                <td className="px-4 py-3"><Badge value={b.status} /></td>
                <td className="px-4 py-3"><Badge value={b.capacityState} /></td>
                <td className="px-4 py-3 text-right">
                  {b.status === 'INACTIVE' ? (
                    <button onClick={() => handleRecommission(b.id)} className="text-xs font-medium text-emerald-700 hover:underline">
                      Recommission
                    </button>
                  ) : (
                    <button onClick={() => handleDecommission(b.id)} className="text-xs font-medium text-red-700 hover:underline">
                      Decommission
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {buses.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-dim">
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
