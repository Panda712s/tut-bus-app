import clsx from 'clsx';

// Dark-tuned status chips: translucent fill + inset ring, bright label.
const COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-400/25',
  ON_TRIP: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-sky-600/20 dark:ring-sky-400/25',
  INACTIVE: 'bg-accent/[0.06] text-ink-muted ring-ink/10',
  MAINTENANCE: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-400/25',
  SUSPENDED: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-400/25',
  DEACTIVATED: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-400/25',
  EMPTY: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-400/25',
  MODERATE: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-400/25',
  FULL: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-400/25',
  IN_PROGRESS: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-sky-600/20 dark:ring-sky-400/25',
  PAUSED: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-400/25',
  COMPLETED: 'bg-accent/[0.06] text-ink-muted ring-ink/10',
  CANCELLED: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-400/25',
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
