'use client';

import { useState } from 'react';
import { DAY_LABEL, DAY_TYPES, type DayType } from '@/hooks/useSchedules';

/** Small dropdown on each day column of the Schedules grid, letting the
 * admin copy every departure time from that day onto another. */
export function CopyMenu({ day, onCopy }: { day: DayType; onCopy: (to: DayType) => void }) {
  const [open, setOpen] = useState(false);
  const targets = DAY_TYPES.filter((d) => d !== day);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-accent/[0.06]"
      >
        Copy to ▾
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          {targets.map((t) => (
            <button
              key={t}
              onMouseDown={() => onCopy(t)}
              className="block w-full px-3 py-2 text-left text-xs text-ink transition-colors hover:bg-accent/[0.06]"
            >
              {DAY_LABEL[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
