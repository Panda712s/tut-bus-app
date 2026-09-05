'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Schedule } from '@/lib/types';

export const DAY_TYPES = ['WEEKDAY', 'WEEKEND', 'HOLIDAY'] as const;
export const PERIODS = ['MORNING', 'AFTERNOON', 'EVENING'] as const;
export type DayType = (typeof DAY_TYPES)[number];
export type Period = (typeof PERIODS)[number];

export const DAY_LABEL: Record<DayType, string> = { WEEKDAY: 'Weekday', WEEKEND: 'Weekend', HOLIDAY: 'Holiday' };
export const PERIOD_LABEL: Record<Period, string> = { MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening' };

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

export function useSchedules(routeId: string) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!routeId) return;
    api
      .get<Schedule[]>(`/schedules?routeId=${routeId}`)
      .then(setSchedules)
      .catch((e) => setError(e.message));
  }, [routeId]);

  useEffect(() => {
    if (routeId) reload();
  }, [routeId, reload]);

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

  /** Posts a new departure slot, choosing its time automatically. Returns the
   * time used on success (for the caller to toast), or null on failure. */
  async function addTime(dayType: DayType, period: Period): Promise<string | null> {
    if (!routeId) return null;
    const existing = grid[dayType][period].map((s) => s.departureTime);
    const departureTime = nextTime(existing, period);
    try {
      await api.post('/schedules', { routeId, dayType, period, departureTime });
      reload();
      return departureTime;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add departure');
      return null;
    }
  }

  async function updateTime(id: string, departureTime: string): Promise<boolean> {
    // optimistic
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, departureTime } : s)));
    try {
      await api.patch(`/schedules/${id}`, { departureTime });
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update time');
      reload();
      return false;
    }
  }

  async function removeTime(id: string): Promise<boolean> {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.patch(`/schedules/${id}/deactivate`);
      return true;
    } catch {
      reload();
      return false;
    }
  }

  /** Copies every departure time from one day to another, skipping times the
   * target day already has. Returns how many were added. */
  async function copyDay(from: DayType, to: DayType): Promise<number> {
    if (!routeId || from === to) return 0;
    const target = grid[to];
    let added = 0;
    for (const period of PERIODS) {
      const have = new Set(target[period].map((s) => s.departureTime));
      for (const s of grid[from][period]) {
        if (have.has(s.departureTime)) continue;
        // eslint-disable-next-line no-await-in-loop
        await api.post('/schedules', { routeId, dayType: to, period, departureTime: s.departureTime });
        added += 1;
      }
    }
    reload();
    return added;
  }

  return { schedules, grid, error, setError, reload, addTime, updateTime, removeTime, copyDay };
}
