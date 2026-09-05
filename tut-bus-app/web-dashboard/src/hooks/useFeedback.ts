'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { FeedbackItem, TripRatingItem } from '@/lib/types';

export function useFeedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [ratings, setRatings] = useState<TripRatingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<FeedbackItem[]>('/feedback').then(setFeedback).catch((e) => setError(e.message));
    api.get<TripRatingItem[]>('/ratings/recent').then(setRatings).catch(() => undefined);
  }, []);

  return { feedback, ratings, error };
}
