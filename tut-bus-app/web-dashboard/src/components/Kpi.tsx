/** Small tone-colored stat pill used on the Operations fleet wall. */
export function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'warn' | 'alert';
}) {
  const toneClass =
    tone === 'alert'
      ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
      : tone === 'warn'
        ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
        : 'border-line bg-surface text-ink';
  return (
    <div className={`rounded-xl border p-4 shadow-card ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
