/** Loading skeleton for the stats page: mirrors the chart card + streak table. */
export default function StatsLoading() {
  return (
    <section role="status" aria-live="polite">
      <div className="mb-6 h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex flex-col gap-8">
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="h-4 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-3 w-56 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-4 h-56 w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-900" />
        </div>
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
              />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading stats…</span>
    </section>
  );
}
