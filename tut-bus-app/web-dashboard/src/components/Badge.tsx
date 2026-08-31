import clsx from 'clsx';

const COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 ring-green-600/20',
  ON_TRIP: 'bg-blue-100 text-blue-700 ring-blue-600/20',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  MAINTENANCE: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  SUSPENDED: 'bg-red-100 text-red-700 ring-red-600/20',
  EMPTY: 'bg-green-100 text-green-700 ring-green-600/20',
  MODERATE: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  FULL: 'bg-red-100 text-red-700 ring-red-600/20',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 ring-blue-600/20',
  PAUSED: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  COMPLETED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  CANCELLED: 'bg-red-100 text-red-700 ring-red-600/20',
  SCHEDULED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        COLORS[value] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20',
      )}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}
