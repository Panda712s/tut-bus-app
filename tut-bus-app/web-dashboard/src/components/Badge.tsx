import clsx from 'clsx';

// Dark-tuned status chips: translucent fill + inset ring, bright label.
const COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  ON_TRIP: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  INACTIVE: 'bg-accent/[0.06] text-ink-muted ring-ink/10',
  MAINTENANCE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  SUSPENDED: 'bg-red-50 text-red-700 ring-red-600/20',
  EMPTY: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  MODERATE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  FULL: 'bg-red-50 text-red-700 ring-red-600/20',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  PAUSED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  COMPLETED: 'bg-accent/[0.06] text-ink-muted ring-ink/10',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
  SCHEDULED: 'bg-accent/[0.06] text-ink-muted ring-ink/10',
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        COLORS[value] ?? 'bg-accent/[0.06] text-ink-muted ring-ink/10',
      )}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}
