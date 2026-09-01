import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const CONTROL_CLASS =
  'w-full rounded-xl border border-line bg-surface-inset px-3.5 py-2.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-dim hover:border-white/15 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/35 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">{label}</label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={CONTROL_CLASS} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={CONTROL_CLASS} />;
}
