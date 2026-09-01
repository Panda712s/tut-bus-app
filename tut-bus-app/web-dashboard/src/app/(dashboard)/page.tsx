'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import type { AnalyticsOverview } from '@/lib/types';

export default function OverviewPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [tripsPerDay, setTripsPerDay] = useState<{ date: string; count: number }[]>([]);
  const [busiestRoutes, setBusiestRoutes] = useState<{ name: string; tripCount: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<AnalyticsOverview>('/analytics/overview'),
      api.get<{ date: string; count: number }[]>('/analytics/trips-per-day?days=14'),
      api.get<{ name: string; tripCount: number }[]>('/analytics/busiest-routes?limit=5'),
    ])
      .then(([o, t, r]) => {
        setOverview(o);
        setTripsPerDay(t);
        setBusiestRoutes(r);
      })
      .catch((e) => setError(e.message ?? 'Failed to load analytics'));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Overview</h1>
      <p className="mb-6 text-sm text-ink-muted">A snapshot of the TUT Bus App system right now.</p>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Active students" value={overview?.studentCount ?? '—'} />
        <StatCard label="Active drivers" value={overview?.driverCount ?? '—'} />
        <StatCard label="Buses on the road" value={overview?.busCount ?? '—'} />
        <StatCard label="Trips in progress" value={overview?.activeTripCount ?? '—'} />
        <StatCard label="Active routes" value={overview?.routeCount ?? '—'} />
        <StatCard
          label="Avg. driver rating"
          value={overview?.averageDriverRating ? overview.averageDriverRating.toFixed(1) : '—'}
          hint={`${overview?.feedbackCount ?? 0} feedback entries`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">Trips over the last 14 days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tripsPerDay} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="tripLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6C7385' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#6C7385' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.12)' }}
                  contentStyle={{
                    background: '#1A1E2B',
                    border: '1px solid #262B3A',
                    borderRadius: 12,
                    color: '#E8EAF0',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#A2A9BC' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="url(#tripLine)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#0b0d12', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-ink">Busiest routes</h2>
          <ul className="space-y-3">
            {busiestRoutes.map((r) => (
              <li key={r.name} className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{r.name}</span>
                <span className="font-semibold text-ink">{r.tripCount}</span>
              </li>
            ))}
            {busiestRoutes.length === 0 && <p className="text-sm text-ink-dim">No trip data yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
