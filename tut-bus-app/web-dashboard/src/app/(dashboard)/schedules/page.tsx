'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Field, Select } from '@/components/Field';
import { CopyMenu } from '@/components/CopyMenu';
import { useSchedules, DAY_TYPES, PERIODS, DAY_LABEL, PERIOD_LABEL, type DayType, type Period } from '@/hooks/useSchedules';
import type { Route } from '@/lib/types';

export default function SchedulesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const { schedules, grid, error, setError, addTime, updateTime, removeTime, copyDay } = useSchedules(selectedRoute);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => {
    api.get<Route[]>('/routes').then((r) => {
      setRoutes(r);
      setSelectedRoute((cur) => cur || r[0]?.id || '');
    });
  }, []);

  async function handleAddTime(dayType: DayType, period: Period) {
    const departureTime = await addTime(dayType, period);
    if (departureTime) flash(`Added ${departureTime} · ${DAY_LABEL[dayType]} ${PERIOD_LABEL[period].toLowerCase()}`);
  }

  async function handleUpdateTime(id: string, departureTime: string) {
    const ok = await updateTime(id, departureTime);
    if (ok) flash(`Updated to ${departureTime}`);
  }

  async function handleRemoveTime(id: string) {
    const ok = await removeTime(id);
    if (ok) flash('Removed');
  }

  async function handleCopyDay(from: DayType, to: DayType) {
    if (!selectedRoute || from === to) return;
    const added = await copyDay(from, to);
    flash(added ? `Copied ${added} time${added > 1 ? 's' : ''} to ${DAY_LABEL[to]}` : `${DAY_LABEL[to]} already has these times`);
  }

  const totalCount = schedules.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Schedules</h1>
          <p className="text-sm text-ink-muted">
            Departure times per route. Change a time to update it, or add slots under any period.
          </p>
        </div>
        <div className="w-64">
          <Field label="Route">
            <Select value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)}>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {error && (
        <p className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-xs underline">
            dismiss
          </button>
        </p>
      )}

      <p className="mb-3 text-xs text-ink-dim">
        {totalCount} departure time{totalCount === 1 ? '' : 's'} on this route
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {DAY_TYPES.map((day) => (
          <div key={day} className="rounded-2xl border border-line bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">{DAY_LABEL[day]}</h2>
              <CopyMenu day={day} onCopy={(to) => handleCopyDay(day, to)} />
            </div>
            <div className="space-y-4 p-4">
              {PERIODS.map((period) => (
                <div key={period}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-dim">
                    {PERIOD_LABEL[period]}
                  </p>
                  <div className="space-y-1.5">
                    {grid[day][period].map((s) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <input
                          type="time"
                          defaultValue={s.departureTime}
                          onChange={(e) => e.target.value && handleUpdateTime(s.id, e.target.value)}
                          className="w-28 rounded-lg border border-line bg-surface-inset px-2.5 py-1.5 text-sm tabular-nums text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                        />
                        <button
                          onClick={() => handleRemoveTime(s.id)}
                          aria-label="Remove departure"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddTime(day, period)}
                      className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/[0.06]"
                    >
                      <span className="text-sm leading-none">＋</span> add time
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-card animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
