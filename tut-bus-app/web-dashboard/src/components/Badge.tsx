import clsx from 'clsx';

// Dark-tuned status chips: translucent fill + inset ring, bright label.
const COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
  ON_TRIP: 'bg-sky-500/15 text-sky-300 ring-sky-500/25',
  INACTIVE: 'bg-white/5 text-ink-muted ring-white/10',
  MAINTENANCE: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
  SUSPENDED: 'bg-red-500/15 text-red-300 ring-red-500/25',
  EMPTY: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
  MODERATE: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
  FULL: 'bg-red-500/15 text-red-300 ring-red-500/25',
  IN_PROGRESS: 'bg-sky-500/15 text-sky-300 ring-sky-500/25',
  PAUSED: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
  COMPLETED: 'bg-white/5 text-ink-muted ring-white/10',
  CANCELLED: 'bg-red-500/15 text-red-300 ring-red-500/25',
  SCHEDULED: 'bg-white/5 text-ink-muted ring-white/10',
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        COLORS[value] ?? 'bg-white/5 text-ink-muted ring-white/10',
      )}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}
