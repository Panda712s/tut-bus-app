'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { getNotificationsSocket } from '@/lib/socket';
import type { FleetSnapshot, DeviationAlert, SosAlert } from '@/lib/types';

const POLL_MS = 10_000;

/** Live fleet wall data: polls every 10s and also refreshes on the relevant
 * socket events, same as the page used to do inline. */
export function useOperations() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null);
  const [deviations, setDeviations] = useState<DeviationAlert[]>([]);
  const [sos, setSos] = useState<SosAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const reload = useCallback(async () => {
    try {
      const [f, d, s] = await Promise.all([
        api.get<FleetSnapshot>('/ops/fleet'),
        api.get<DeviationAlert[]>('/ops/deviations?status=OPEN'),
        api.get<SosAlert[]>('/safety/sos?status=ACTIVE'),
      ]);
      setFleet(f);
      setDeviations(d);
      setSos(s);
      setError(null);
      setPulse((p) => !p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load operations data');
    }
  }, []);

  useEffect(() => {
    reload();
    timer.current = setInterval(reload, POLL_MS);
    const sock = getNotificationsSocket();
    const bump = () => reload();
    sock.on('sos:new', bump);
    sock.on('sos:updated', bump);
    sock.on('ops:deviation', bump);
    sock.on('ops:deviation-cleared', bump);
    return () => {
      if (timer.current) clearInterval(timer.current);
      sock.off('sos:new', bump);
      sock.off('sos:updated', bump);
      sock.off('ops:deviation', bump);
      sock.off('ops:deviation-cleared', bump);
    };
  }, [reload]);

  async function ackSos(id: string) {
    await api.patch(`/safety/sos/${id}/acknowledge`);
    reload();
  }
  async function resolveSos(id: string) {
    await api.patch(`/safety/sos/${id}/resolve`);
    reload();
  }
  async function clearDeviation(id: string) {
    await api.patch(`/ops/deviations/${id}/clear`);
    reload();
  }

  return { fleet, deviations, sos, error, pulse, reload, ackSos, resolveSos, clearDeviation };
}
