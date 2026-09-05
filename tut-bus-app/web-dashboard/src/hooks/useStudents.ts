'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Student } from '@/lib/types';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api.get<Student[]>('/students').then(setStudents).catch((e) => setError(e.message));
  }, []);

  useEffect(reload, [reload]);

  async function activate(id: string) {
    await api.patch(`/students/${id}/activate`);
    reload();
  }

  async function deactivate(id: string) {
    await api.patch(`/students/${id}/deactivate`);
    reload();
  }

  return { students, error, reload, activate, deactivate };
}
