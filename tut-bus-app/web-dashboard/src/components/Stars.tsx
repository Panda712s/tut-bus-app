export function Stars({ score }: { score: number }) {
  return (
    <span className="text-amber-500" aria-label={`${score} out of 5`}>
      {'★'.repeat(score)}
      <span className="text-ink-dim">{'★'.repeat(5 - score)}</span>
    </span>
  );
}
