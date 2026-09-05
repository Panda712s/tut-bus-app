'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TripsPerDayPoint } from '@/hooks/useOverview';

export function TripsPerDayChart({ data }: { data: TripsPerDayPoint[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm lg:col-span-2">
      <h2 className="mb-4 text-sm font-semibold text-ink">Trips over the last 14 days</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="tripLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0A5796" />
                <stop offset="100%" stopColor="#FAB416" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,34,54,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#828FA2' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(15,34,54,0.12)' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#828FA2' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(15,34,54,0.15)' }}
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #E0E7F0',
                borderRadius: 12,
                color: '#0F2236',
                fontSize: 12,
                boxShadow: '0 8px 24px -12px rgba(15,34,54,0.18)',
              }}
              labelStyle={{ color: '#4C5C70' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="url(#tripLine)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#0A5796', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
