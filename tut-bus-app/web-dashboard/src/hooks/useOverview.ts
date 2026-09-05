'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AnalyticsOverview } from '@/lib/types';

export interface TripsPerDayPoint {
  date: string;
  count: number;
}

export interface BusiestRoute {
  name: string;
  tripCount: number;
}

export function useOverview() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [tripsPerDay, setTripsPerDay] = useState<TripsPerDayPoint[]>([]);
  const [busiestRoutes, setBusiestRoutes] = useState<BusiestRoute[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<AnalyticsOverview>('/analytics/overview'),
      api.get<TripsPerDayPoint[]>('/analytics/trips-per-day?days=14'),
      api.get<BusiestRoute[]>('/analytics/busiest-routes?limit=5'),
    ])
      .then(([o, t, r]) => {
        setOverview(o);
        setTripsPerDay(t);
        setBusiestRoutes(r);
      })
      .catch((e) => setError(e.message ?? 'Failed to load analytics'));
  }, []);

  return { overview, tripsPerDay, busiestRoutes, error };
}
