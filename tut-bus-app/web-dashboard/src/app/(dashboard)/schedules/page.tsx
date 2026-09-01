'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Field, Select } from '@/components/Field';
import type { Route, Schedule } from '@/lib/types';

const DAY_TYPES = ['WEEKDAY', 'WEEKEND', 'HOLIDAY'] as const;
const PERIODS = ['MORNING', 'AFTERNOON', 'EVENING'] as const;
type DayType = (typeof DAY_TYPES)[number];
type Period = (typeof PERIODS)[number];

const DAY_LABEL: Record<DayType, string> = { WEEKDAY: 'Weekday', WEEKEND: 'Weekend', HOLIDAY: 'Holiday' };
const PERIOD_LABEL: Record<Period, string> = { MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening' };

/** Sensible default time per period, and the next slot after an existing list. */
function nextTime(existing: string[], period: Period): string {
  if (existing.length) {
    const last = existing[existing.length - 1];
    const [h, m] = last.split(':').map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  return period === 'MORNING' ? '07:00' : period === 'AFTERNOON' ? '12:00' : '17:00';
}

export default function SchedulesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const load = useCallback(
    (routeId: string) => {
      if (!routeId) return;
      api
        .get<Schedule[]>(`/schedules?routeId=${routeId}`)
        .then(setSchedules)
        .catch((e) => setError(e.message));
    },
    [],
  );

  useEffect(() => {
    api.get<Route[]>('/routes').then((r) => {
      setRoutes(r);
      setSelectedRoute((cur) => cur || r[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (selectedRoute) load(selectedRoute);
  }, [selectedRoute, load]);

  // times[day][period] = sorted Schedule[]
  const grid = useMemo(() => {
    const g: Record<DayType, Record<Period, Schedule[]>> = {
      WEEKDAY: { MORNING: [], AFTERNOON: [], EVENING: [] },
      WEEKEND: { MORNING: [], AFTERNOON: [], EVENING: [] },
      HOLIDAY: { MORNING: [], AFTERNOON: [], EVENING: [] },
    };
    for (const s of schedules) {
      const d = g[s.dayType as DayType];
      const p = d?.[s.period as Period];
      if (p) p.push(s);
    }
    for (const d of DAY_TYPES) for (const p of PERIODS) g[d][p].sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    return g;
  }, [schedules]);

  async function addTime(dayType: DayType, period: Period) {
    if (!selectedRoute) return;
    const existing = grid[dayType][period].map((s) => s.departureTime);
    const departureTime = nextTime(existing, period);
    try {
      await api.post('/schedules', { routeId: selectedRoute, dayType, period, departureTime });
      flash(`Added ${departureTime} · ${DAY_LABEL[dayType]} ${PERIOD_LABEL[period].toLowerCase()}`);
      load(selectedRoute);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add departure');
    }
  }

  async function updateTime(id: string, departureTime: string) {
    // optimistic
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, departureTime } : s)));
    try {
      await api.patch(`/schedules/${id}`, { departureTime });
      flash(`Updated to ${departureTime}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update time');
      load(selectedRoute);
    }
  }

  async function removeTime(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.patch(`/schedules/${id}/deactivate`);
      flash('Removed');
    } catch {
      load(selectedRoute);
    }
  }

  async function copyDay(from: DayType, to: DayType) {
    if (!selectedRoute || from === to) return;
    const target = grid[to];
    let added = 0;
    for (const period of PERIODS) {
      const have = new Set(target[period].map((s) => s.departureTime));
      for (const s of grid[from][period]) {
        if (have.has(s.departureTime)) continue;
        // eslint-disable-next-line no-await-in-loop
        await api.post('/schedules', { routeId: selectedRoute, dayType: to, period, departureTime: s.departureTime });
        added += 1;
      }
    }
    flash(added ? `Copied ${added} time${added > 1 ? 's' : ''} to ${DAY_LABEL[to]}` : `${DAY_LABEL[to]} already has these times`);
    load(selectedRoute);
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
              <CopyMenu day={day} onCopy={(to) => copyDay(day, to)} />
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
                          onChange={(e) => e.target.value && updateTime(s.id, e.target.value)}
                          className="w-28 rounded-lg border border-line bg-surface-inset px-2.5 py-1.5 text-sm tabular-nums text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                        />
                        <button
                          onClick={() => removeTime(s.id)}
                          aria-label="Remove departure"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addTime(day, period)}
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

function CopyMenu({ day, onCopy }: { day: DayType; onCopy: (to: DayType) => void }) {
  const [open, setOpen] = useState(false);
  const targets = DAY_TYPES.filter((d) => d !== day);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-accent/[0.06]"
      >
        Copy to ▾
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          {targets.map((t) => (
            <button
              key={t}
              onMouseDown={() => onCopy(t)}
              className="block w-full px-3 py-2 text-left text-xs text-ink transition-colors hover:bg-accent/[0.06]"
            >
              {DAY_LABEL[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
