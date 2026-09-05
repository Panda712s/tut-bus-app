'use client';

import { Stars } from '@/components/Stars';
import { TagChip } from '@/components/TagChip';
import { relativeTime } from '@/lib/format';
import { useFeedback } from '@/hooks/useFeedback';

const CATEGORY_LABEL: Record<string, string> = {
  DRIVER_RATING: 'Driver rating',
  ISSUE_REPORT: 'Issue report',
  SUGGESTION: 'Suggestion',
};

export default function FeedbackPage() {
  const { feedback, ratings, error } = useFeedback();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Feedback</h1>
      <p className="mb-6 text-sm text-ink-muted">Ratings, issue reports and suggestions submitted by students.</p>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {ratings.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">Post-trip ratings</h2>
          <div className="space-y-3">
            {ratings.map((r) => (
              <div key={r.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                    {r.direction === 'STUDENT_TO_DRIVER' ? 'Rider → driver' : 'Driver → trip'}
                  </span>
                  <span className="text-xs text-ink-dim">{relativeTime(r.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Stars score={r.score} />
                  <span className="text-sm text-ink-muted">
                    {r.trip?.route?.name ?? 'Trip'}
                    {r.direction === 'STUDENT_TO_DRIVER' && r.driver ? ` · ${r.driver.fullName}` : ''}
                  </span>
                </div>
                {r.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <TagChip key={t} tag={t} />
                    ))}
                  </div>
                )}
                {r.comment && <p className="mt-2 text-sm text-ink">{r.comment}</p>}
                {r.direction === 'STUDENT_TO_DRIVER' && r.student && (
                  <p className="mt-2 text-xs text-ink-dim">
                    — {r.student.fullName} ({r.student.studentNumber})
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        {ratings.length > 0 && <h2 className="mb-3 text-sm font-semibold text-ink">All feedback</h2>}
        <div className="space-y-3">
          {feedback.map((f) => (
            <div key={f.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {CATEGORY_LABEL[f.category] ?? f.category}
                </span>
                <span className="text-xs text-ink-dim">{new Date(f.createdAt).toLocaleString()}</span>
              </div>
              {f.rating != null && <Stars score={f.rating} />}
              {f.comment && <p className="mt-1 text-sm text-ink">{f.comment}</p>}
              {f.student && (
                <p className="mt-2 text-xs text-ink-dim">
                  — {f.student.fullName} ({f.student.studentNumber})
                </p>
              )}
            </div>
          ))}
          {feedback.length === 0 && <p className="text-ink-dim">No feedback submitted yet.</p>}
        </div>
      </section>
    </div>
  );
}
