import type { ReactNode } from 'react';
import clsx from 'clsx';

const TONES = {
  accent: 'bg-accent/10 text-accent',
  gold: 'bg-gold/15 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'accent',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover">
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-dim">{label}</p>
        {icon && (
          <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-dim">{hint}</p>}
    </div>
  );
}
