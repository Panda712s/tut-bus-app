'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Bus, Driver, Route } from '@/lib/types';

export interface BusCreatePayload {
  busNumber: string;
  plateNumber: string;
  capacity: number;
  currentRouteId?: string;
}

export function useBuses() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api.get<Bus[]>('/buses').then(setBuses).catch((e) => setError(e.message));
    api.get<Route[]>('/routes').then(setRoutes).catch(() => undefined);
    api.get<Driver[]>('/drivers').then(setDrivers).catch(() => undefined);
  }, []);

  useEffect(reload, [reload]);

  async function create(payload: BusCreatePayload) {
    await api.post('/buses', payload);
    reload();
  }

  async function decommission(id: string) {
    await api.patch(`/buses/${id}/decommission`);
    reload();
  }

  async function recommission(id: string) {
    await api.patch(`/buses/${id}`, { status: 'ACTIVE' });
    reload();
  }

  return { buses, routes, drivers, error, setError, reload, create, decommission, recommission };
}
