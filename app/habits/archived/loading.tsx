/**
 * Loading skeleton for the archived-habits list. Safe to stream: this route only
 * lists the user's archived habits and never calls `notFound()`, so streaming a
 * fallback here doesn't turn a 404 into a soft 404 (see the note in p19).
 */
export default function ArchivedLoading() {
  return (
    <section role="status" aria-live="polite">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900"
          />
        ))}
      </div>
      <span className="sr-only">Loading archived habits…</span>
    </section>
  );
}
