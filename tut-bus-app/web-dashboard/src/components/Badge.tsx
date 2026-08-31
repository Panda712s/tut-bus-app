import clsx from 'clsx';

const COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  ON_TRIP: 'bg-blue-100 text-blue-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  EMPTY: 'bg-green-100 text-green-700',
  MODERATE: 'bg-amber-100 text-amber-700',
  FULL: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-700',
  SCHEDULED: 'bg-slate-100 text-slate-600',
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', COLORS[value] ?? 'bg-slate-100 text-slate-600')}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}
