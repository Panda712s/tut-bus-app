'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { FeedbackItem } from '@/lib/types';

const CATEGORY_LABEL: Record<string, string> = {
  DRIVER_RATING: 'Driver rating',
  ISSUE_REPORT: 'Issue report',
  SUGGESTION: 'Suggestion',
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<FeedbackItem[]>('/feedback').then(setFeedback).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Feedback</h1>
      <p className="mb-6 text-sm text-slate-500">Ratings, issue reports and suggestions submitted by students.</p>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {feedback.map((f) => (
          <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {CATEGORY_LABEL[f.category] ?? f.category}
              </span>
              <span className="text-xs text-slate-400">{new Date(f.createdAt).toLocaleString()}</span>
            </div>
            {f.rating != null && <p className="text-sm text-amber-500">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</p>}
            {f.comment && <p className="mt-1 text-sm text-slate-700">{f.comment}</p>}
            {f.student && (
              <p className="mt-2 text-xs text-slate-400">— {f.student.fullName} ({f.student.studentNumber})</p>
            )}
          </div>
        ))}
        {feedback.length === 0 && <p className="text-slate-400">No feedback submitted yet.</p>}
      </div>
    </div>
  );
}
