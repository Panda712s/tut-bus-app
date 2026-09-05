'use client';

import { FormEvent, useState } from 'react';
import { ApiError } from '@/lib/api';
import { Field, Input, Select } from '@/components/Field';
import { useNotifications } from '@/hooks/useNotifications';

const TYPES = ['GENERAL', 'BUS_ARRIVAL', 'BUS_DEPARTURE', 'DELAY_ALERT', 'ROUTE_CHANGE', 'WEATHER_ALERT', 'EMERGENCY'];
const AUDIENCES = ['ALL_STUDENTS', 'ROUTE_STUDENTS', 'ALL_DRIVERS'];

export default function NotificationsPage() {
  const { notifications, routes, error, setError, send } = useNotifications();
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', body: '', type: 'GENERAL', audience: 'ALL_STUDENTS', routeId: '' });

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await send({
        title: form.title,
        body: form.body,
        type: form.type,
        audience: form.audience,
        routeId: form.audience === 'ROUTE_STUDENTS' ? form.routeId : undefined,
      });
      setSuccess('Notification sent.');
      setForm({ title: '', body: '', type: 'GENERAL', audience: 'ALL_STUDENTS', routeId: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send notification');
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Notifications</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Push a message to students or drivers - delivered instantly over WebSocket and (once configured) FCM.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-ink">Compose</h2>
          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
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
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
            <button type="submit" className="w-full rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]">
              Send notification
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-surface-inset text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td className="px-4 py-3 font-medium text-ink">{n.title}</td>
                  <td className="px-4 py-3 text-ink-muted">{n.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-ink-muted">{n.audience.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-ink-dim">{new Date(n.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink-dim">
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
