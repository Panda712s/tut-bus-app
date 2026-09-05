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
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-line bg-surface text-ink';
  return (
    <div className={`rounded-xl border p-4 shadow-card ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
