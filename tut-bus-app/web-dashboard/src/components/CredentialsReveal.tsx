'use client';

import { useState } from 'react';

/** One-time reveal of a driver's sign-in email + temporary password, shown
 * right after creating or resetting an account. Passwords are one-way
 * hashed server-side and can never be looked up again, so this is the only
 * chance the admin gets to copy it down. */
export function CredentialsReveal({
  email,
  password,
  onDone,
}: {
  email: string;
  password: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState<'email' | 'password' | null>(null);

  async function copy(value: string, which: 'email' | 'password') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500);
    } catch {
      // Clipboard permission denied - the value is still visible to select/copy manually.
    }
  }

  return (
    <div>
      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
        This is the only time this password will be shown. Copy it down or send it to the driver now - if it&apos;s lost later, use <span className="font-semibold">Reset password</span> from that driver&apos;s Edit screen.
      </p>

      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">Sign-in email</label>
      <div className="mb-3.5 flex items-center gap-2">
        <code className="flex-1 truncate rounded-xl border border-line bg-surface-inset px-3.5 py-2.5 text-sm text-ink">{email}</code>
        <button
          type="button"
          onClick={() => copy(email, 'email')}
          className="shrink-0 rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-accent/[0.06] hover:text-ink"
        >
          {copied === 'email' ? 'Copied ✓' : 'Copy'}
        </button>
      </div>

      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">Temporary password</label>
      <div className="mb-4 flex items-center gap-2">
        <code className="flex-1 truncate rounded-xl border border-accent/30 bg-accent/[0.06] px-3.5 py-2.5 text-sm font-semibold tracking-wide text-ink">{password}</code>
        <button
          type="button"
          onClick={() => copy(password, 'password')}
          className="shrink-0 rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-accent/[0.06] hover:text-ink"
        >
          {copied === 'password' ? 'Copied ✓' : 'Copy'}
        </button>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98]"
      >
        I&apos;ve saved this
      </button>
    </div>
  );
}
