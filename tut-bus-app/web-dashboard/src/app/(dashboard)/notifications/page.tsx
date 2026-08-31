'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Field, Input, Select } from '@/components/Field';
import type { NotificationItem, Route } from '@/lib/types';

const TYPES = ['GENERAL', 'BUS_ARRIVAL', 'BUS_DEPARTURE', 'DELAY_ALERT', 'ROUTE_CHANGE', 'WEATHER_ALERT', 'EMERGENCY'];
const AUDIENCES = ['ALL_STUDENTS', 'ROUTE_STUDENTS', 'ALL_DRIVERS'];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', body: '', type: 'GENERAL', audience: 'ALL_STUDENTS', routeId: '' });

  function load() {
    api.get<NotificationItem[]>('/notifications').then(setNotifications).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    api.get<Route[]>('/routes').then(setRoutes);
  }, []);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.post('/notifications', {
        title: form.title,
        body: form.body,
        type: form.type,
        audience: form.audience,
        routeId: form.audience === 'ROUTE_STUDENTS' ? form.routeId : undefined,
      });
      setSuccess('Notification sent.');
      setForm({ title: '', body: '', type: 'GENERAL', audience: 'ALL_STUDENTS', routeId: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send notification');
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Notifications</h1>
      <p className="mb-6 text-sm text-slate-500">
        Push a message to students or drivers - delivered instantly over WebSocket and (once configured) FCM.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Compose</h2>
          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}
          <form onSubmit={handleSend}>
            <Field label="Title">
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Bus 14 delayed" />
            </Field>
            <Field label="Message">
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Bus 14 will arrive 10 minutes late due to traffic."
              />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Audience">
              <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
              </Select>
            </Field>
            {form.audience === 'ROUTE_STUDENTS' && (
              <Field label="Route">
                <Select required value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })}>
                  <option value="">Select a route</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </Field>
            )}
            <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Send notification
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{n.title}</td>
                  <td className="px-4 py-3 text-slate-600">{n.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{n.audience.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(n.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No notifications sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
