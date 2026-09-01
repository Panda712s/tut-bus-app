'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Field, Input } from '@/components/Field';
import type { Driver } from '@/lib/types';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeNumber: '',
    fullName: '',
    email: '',
    password: '',
    licenseNumber: '',
    phone: '',
  });

  function load() {
    api.get<Driver[]>('/drivers').then(setDrivers).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/drivers', form);
      setOpen(false);
      setForm({ employeeNumber: '', fullName: '', email: '', password: '', licenseNumber: '', phone: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create driver');
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
          <p className="text-sm text-ink-muted">Onboard and manage bus drivers.</p>
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
                <td className="px-4 py-3"><Badge value={d.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDeactivate(d.id)} className="text-xs font-medium text-red-700 hover:underline">
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-dim">
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
          <button type="submit" className="mt-2 w-full rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
            Create driver
          </button>
        </form>
      </Modal>
    </div>
  );
}
