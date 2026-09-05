'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Bus, Driver } from '@/lib/types';

export interface DriverCreatePayload {
  employeeNumber: string;
  fullName: string;
  email: string;
  password?: string;
  licenseNumber: string;
  phone?: string;
  assignedBusId?: string;
}

export interface DriverEditPayload {
  fullName: string;
  phone?: string;
  status: string;
  assignedBusId: string | null;
}

/** Data + mutations for the Drivers admin page. Mirrors the shape of the
 * previous inline state exactly - `error` is the same single banner-driving
 * value the page has always cleared/set around its own mutations, just
 * relocated here so the page can stay focused on layout. */
export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api.get<Driver[]>('/drivers').then(setDrivers).catch((e) => setError(e.message));
    api.get<Bus[]>('/buses').then(setBuses).catch(() => undefined);
  }, []);

  useEffect(reload, [reload]);

  async function create(payload: DriverCreatePayload) {
    const created = await api.post<Driver & { temporaryPassword: string }>('/drivers', payload);
    reload();
    return created;
  }

  async function update(id: string, payload: DriverEditPayload) {
    await api.patch(`/drivers/${id}`, payload);
    reload();
  }

  async function resetPassword(id: string) {
    return api.patch<{ temporaryPassword: string }>(`/drivers/${id}/reset-password`);
  }

  async function activate(id: string) {
    await api.patch(`/drivers/${id}/activate`);
    reload();
  }

  async function deactivate(id: string) {
    await api.patch(`/drivers/${id}/deactivate`);
    reload();
  }

  return { drivers, buses, error, setError, reload, create, update, resetPassword, activate, deactivate };
}
