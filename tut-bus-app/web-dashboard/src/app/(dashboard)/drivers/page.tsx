'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import type { Bus, Driver } from '@/lib/types';

const EMPTY_CREATE_FORM = {
  employeeNumber: '',
  fullName: '',
  email: '',
  password: '',
  licenseNumber: '',
  phone: '',
  assignedBusId: '',
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_CREATE_FORM);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', status: 'ACTIVE', assignedBusId: '' });

  function load() {
    api.get<Driver[]>('/drivers').then(setDrivers).catch((e) => setError(e.message));
    api.get<Bus[]>('/buses').then(setBuses).catch(() => undefined);
  }

  useEffect(load, []);

  // Which bus each driver currently drives, and how many buses still have nobody assigned —
  // this is what tells the admin how many more drivers they still need to onboard.
  const busById = useMemo(() => new Map(buses.map((b) => [b.id, b])), [buses]);
  const assignedBusIds = useMemo(
    () => new Set(drivers.filter((d) => d.isActive && d.assignedBusId).map((d) => d.assignedBusId)),
    [drivers],
  );
  const unassignedBusCount = buses.filter((b) => !assignedBusIds.has(b.id)).length;

  function busLabel(bus: Bus, currentDriverId?: string) {
    const takenBy = drivers.find((d) => d.isActive && d.assignedBusId === bus.id && d.id !== currentDriverId);
    return takenBy ? `${bus.busNumber} — driven by ${takenBy.fullName}` : bus.busNumber;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/drivers', {
        ...form,
        assignedBusId: form.assignedBusId || undefined,
      });
      setOpen(false);
      setForm(EMPTY_CREATE_FORM);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create driver');
    }
  }

  function openEdit(driver: Driver) {
    setEditError(null);
    setEditing(driver);
    setEditForm({
      fullName: driver.fullName,
      phone: driver.phone ?? '',
      status: driver.status,
      assignedBusId: driver.assignedBusId ?? '',
    });
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    try {
      await api.patch(`/drivers/${editing.id}`, {
        fullName: editForm.fullName,
        phone: editForm.phone || undefined,
        status: editForm.status,
        assignedBusId: editForm.assignedBusId || null,
      });
      setEditing(null);
      load();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to update driver');
    }
  }

  async function handleDeactivate(id: string) {
    await api.patch(`/drivers/${id}/deactivate`);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Drivers</h1>
          <p className="text-sm text-ink-muted">
            Onboard and manage bus drivers.{' '}
            {buses.length > 0 && (
              <span className={unassignedBusCount > 0 ? 'font-medium text-amber-700' : 'font-medium text-emerald-700'}>
                {unassignedBusCount > 0
                  ? `${unassignedBusCount} bus${unassignedBusCount === 1 ? '' : 'es'} still need${unassignedBusCount === 1 ? 's' : ''} a driver.`
                  : 'Every bus has a driver.'}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
          + Add driver
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-surface-inset text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Employee #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">Assigned bus</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {drivers.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-ink">{d.employeeNumber}</td>
                <td className="px-4 py-3 text-ink-muted">{d.fullName}</td>
                <td className="px-4 py-3 text-ink-muted">{d.email}</td>
                <td className="px-4 py-3 text-ink-muted">{d.licenseNumber}</td>
                <td className="px-4 py-3">
                  {d.assignedBusId && busById.get(d.assignedBusId) ? (
                    <span className="font-medium text-ink">{busById.get(d.assignedBusId)!.busNumber}</span>
                  ) : (
                    <span className="text-ink-dim">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3"><Badge value={d.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => openEdit(d)} className="text-xs font-medium text-accent hover:underline">
                      Edit
                    </button>
                    {d.isActive && (
                      <button onClick={() => handleDeactivate(d.id)} className="text-xs font-medium text-red-700 hover:underline">
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-dim">
                  No drivers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add driver">
        <form onSubmit={handleCreate}>
          <Field label="Employee number">
            <Input required value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} />
          </Field>
          <Field label="Full name">
            <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Temporary password">
            <Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="License number">
            <Input required value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          </Field>
          <Field label="Phone (optional)">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Assigned bus (optional)">
            <Select value={form.assignedBusId} onChange={(e) => setForm({ ...form, assignedBusId: e.target.value })}>
              <option value="">— None yet —</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>{busLabel(b)}</option>
              ))}
            </Select>
          </Field>
          <button type="submit" className="mt-2 w-full rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
            Create driver
          </button>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.fullName}` : 'Edit driver'}>
        {editing && (
          <form onSubmit={handleSaveEdit}>
            {editError && <p className="mb-3.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}
            <Field label="Full name">
              <Input required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="ACTIVE">Active</option>
                <option value="ON_TRIP">On trip</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </Select>
            </Field>
            <Field label="Assigned bus">
              <Select value={editForm.assignedBusId} onChange={(e) => setEditForm({ ...editForm, assignedBusId: e.target.value })}>
                <option value="">— None —</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>{busLabel(b, editing.id)}</option>
                ))}
              </Select>
            </Field>
            <button type="submit" className="mt-2 w-full rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
              Save changes
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
