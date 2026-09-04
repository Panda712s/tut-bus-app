'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/Badge';
import type { Student } from '@/lib/types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  function load() {
    api.get<Student[]>('/students').then(setStudents).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleDeactivate(id: string) {
    await api.patch(`/students/${id}/deactivate`);
    load();
  }

  async function handleActivate(id: string) {
    await api.patch(`/students/${id}/activate`);
    load();
  }

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentNumber.includes(search) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Students</h1>
          <p className="text-sm text-ink-muted">Registered students (self-registered via the mobile app).</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, number or email"
          className="w-72 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-surface-inset text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Student #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-ink">{s.studentNumber}</td>
                <td className="px-4 py-3 text-ink-muted">{s.fullName}</td>
                <td className="px-4 py-3 text-ink-muted">{s.email}</td>
                <td className="px-4 py-3">{s.emailVerified ? '✅' : '—'}</td>
                <td className="px-4 py-3"><Badge value={s.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                <td className="px-4 py-3 text-right">
                  {s.isActive ? (
                    <button onClick={() => handleDeactivate(s.id)} className="text-xs font-medium text-red-700 hover:underline">
                      Deactivate
                    </button>
                  ) : (
                    <button onClick={() => handleActivate(s.id)} className="text-xs font-medium text-emerald-700 hover:underline">
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-dim">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
