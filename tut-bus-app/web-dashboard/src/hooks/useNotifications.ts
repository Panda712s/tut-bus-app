'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { NotificationItem, Route } from '@/lib/types';

export interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  audience: string;
  routeId?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api.get<NotificationItem[]>('/notifications').then(setNotifications).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    reload();
    api.get<Route[]>('/routes').then(setRoutes);
  }, [reload]);

  async function send(payload: NotificationPayload) {
    await api.post('/notifications', payload);
    reload();
  }

  return { notifications, routes, error, setError, reload, send };
}
