export default function Loading() {
  return (
    <div className="container-page py-8" role="status" aria-label="Loading page">
      <div className="h-6 w-48 animate-pulse rounded bg-ink-200 dark:bg-ink-800" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

      <div className="mt-6 h-40 animate-pulse rounded-card bg-ink-200/70 dark:bg-ink-800/70 sm:h-56" />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900">
            <div className="aspect-square animate-pulse bg-ink-100 dark:bg-ink-800" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
