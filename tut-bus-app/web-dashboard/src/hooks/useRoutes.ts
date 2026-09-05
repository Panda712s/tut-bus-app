'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Route } from '@/lib/types';

export interface RouteCreatePayload {
  name: string;
  origin: string;
  destination: string;
  distanceKm?: number;
  estimatedDurationMin?: number;
}

export interface StopCreatePayload {
  routeId: string;
  name: string;
  lat: number;
  lng: number;
  order?: number;
}

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api.get<Route[]>('/routes').then(setRoutes).catch((e) => setError(e.message));
  }, []);

  useEffect(reload, [reload]);

  async function create(payload: RouteCreatePayload) {
    await api.post('/routes', payload);
    reload();
  }

  async function deactivate(id: string) {
    await api.patch(`/routes/${id}/deactivate`);
    reload();
  }

  /** Adds a stop, then hands back the freshly re-fetched route (with its
   * updated stop list) so the caller can refresh whichever modal is open. */
  async function addStop(payload: StopCreatePayload) {
    await api.post('/stops', payload);
    const refreshed = await api.get<Route>(`/routes/${payload.routeId}`);
    reload();
    return refreshed;
  }

  return { routes, error, setError, reload, create, deactivate, addStop };
}
