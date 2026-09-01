'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, setStoredUser, setTokens } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@tut.ac.za');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/admin/login', { email, password });
      setTokens(res.accessToken, res.refreshToken);
      setStoredUser(res.user);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-accent-grad px-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[30rem] w-[30rem] translate-x-1/3 translate-y-1/3 rounded-full bg-gold/25 blur-[130px]" />

      {/* Official Tshwane University of Technology logo, faint watermark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/tut-logo.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 w-[min(46rem,90vw)] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.08] brightness-0 invert"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-card animate-scale-in">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/tut-logo.svg" alt="Tshwane University of Technology" className="mx-auto mb-5 h-14" />
          <h1 className="text-xl font-semibold tracking-tight text-ink">TUT Bus App</h1>
          <p className="mt-1 text-sm text-ink-muted">Transport administrator sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-inset px-3.5 py-2.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-dim hover:border-ink-dim/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              placeholder="admin@tut.ac.za"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-inset px-3.5 py-2.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-dim hover:border-ink-dim/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent-grad px-4 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-dim">
          Seeded demo account: admin@tut.ac.za / Password123!
        </p>
      </div>
    </div>
  );
}
