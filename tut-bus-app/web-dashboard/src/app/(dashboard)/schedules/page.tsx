'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Field, Input, Select } from '@/components/Field';
import type { Route, Schedule } from '@/lib/types';

const DAY_TYPES = ['WEEKDAY', 'WEEKEND', 'HOLIDAY'] as const;
const PERIODS = ['MORNING', 'AFTERNOON', 'EVENING'] as const;

export default function SchedulesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ dayType: 'WEEKDAY', period: 'MORNING', departureTime: '07:00' });

  useEffect(() => {
    api.get<Route[]>('/routes').then((r) => {
      setRoutes(r);
      if (r.length && !selectedRoute) setSelectedRoute(r[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadSchedules(routeId: string) {
    if (!routeId) return;
    api.get<Schedule[]>(`/schedules?routeId=${routeId}`).then(setSchedules).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (selectedRoute) loadSchedules(selectedRoute);
  }, [selectedRoute]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!selectedRoute) return;
    setError(null);
    try {
      await api.post('/schedules', { routeId: selectedRoute, ...form });
      loadSchedules(selectedRoute);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add schedule');
    }
  }

  async function handleRemove(id: string) {
    await api.patch(`/schedules/${id}/deactivate`);
    loadSchedules(selectedRoute);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Schedules</h1>
      <p className="mb-6 text-sm text-slate-500">Morning, afternoon, weekend and holiday departure times per route.</p>

      <div className="mb-6 max-w-xs">
        <Field label="Route">
          <Select value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)}>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Day type</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Departure</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-slate-600">{s.dayType}</td>
                  <td className="px-4 py-3 text-slate-600">{s.period}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{s.departureTime}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleRemove(s.id)} className="text-xs font-medium text-red-600 hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No schedules for this route yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Add departure time</h2>
          <form onSubmit={handleCreate}>
            <Field label="Day type">
              <Select value={form.dayType} onChange={(e) => setForm({ ...form, dayType: e.target.value })}>
                {DAY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Period">
              <Select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Departure time (24h)">
              <Input type="time" required value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} />
            </Field>
            <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
