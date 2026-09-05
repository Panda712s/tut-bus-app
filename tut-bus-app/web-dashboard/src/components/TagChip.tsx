const NEGATIVE_TAGS = ['RECKLESS', 'LATE', 'OVERCROWDED', 'RUDE', 'SKIPPED_STOP', 'BEHIND_SCHEDULE', 'VEHICLE_ISSUE', 'PASSENGER_ISSUE'];

export function TagChip({ tag }: { tag: string }) {
  const negative = NEGATIVE_TAGS.includes(tag);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        negative ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-400/25' : 'bg-surface-raised text-ink-muted ring-ink/10'
      }`}
    >
      {tag.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}
