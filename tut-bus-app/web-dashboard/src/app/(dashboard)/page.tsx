'use client';

import { StatCard } from '@/components/StatCard';
import { TripsPerDayChart } from '@/components/TripsPerDayChart';
import { BusiestRoutesCard } from '@/components/BusiestRoutesCard';
import { useOverview } from '@/hooks/useOverview';
import { IconGraduationCap, IconIdCard, IconBus, IconPulse, IconRoute, IconStar } from '@/components/icons';

export default function OverviewPage() {
  const { overview, tripsPerDay, busiestRoutes, error } = useOverview();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Overview</h1>
      <p className="mb-6 text-sm text-ink-muted">A snapshot of the TUT Bus App system right now.</p>

      {error && <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</p>}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Active students"
          value={overview?.studentCount ?? '—'}
          icon={<IconGraduationCap className="h-4 w-4" />}
          tone="sky"
        />
        <StatCard
          label="Active drivers"
          value={overview?.driverCount ?? '—'}
          icon={<IconIdCard className="h-4 w-4" />}
          tone="accent"
        />
        <StatCard
          label="Buses on the road"
          value={overview?.busCount ?? '—'}
          icon={<IconBus className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Trips in progress"
          value={overview?.activeTripCount ?? '—'}
          icon={<IconPulse className="h-4 w-4" />}
          tone="gold"
        />
        <StatCard
          label="Active routes"
          value={overview?.routeCount ?? '—'}
          icon={<IconRoute className="h-4 w-4" />}
          tone="violet"
        />
        <StatCard
          label="Avg. driver rating"
          value={overview?.averageDriverRating ? overview.averageDriverRating.toFixed(1) : '—'}
          hint={`${overview?.feedbackCount ?? 0} feedback entries`}
          icon={<IconStar className="h-4 w-4" />}
          tone="gold"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TripsPerDayChart data={tripsPerDay} />
        <BusiestRoutesCard routes={busiestRoutes} />
      </div>
    </div>
  );
}
