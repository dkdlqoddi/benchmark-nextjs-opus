"use client";
// Client Component: React error boundaries must run on the client. This catches
// runtime errors from any page/segment below the root layout; errors in the root
// layout itself are handled by app/global-error.tsx.

import { useEffect } from "react";
import Link from "next/link";

/** Route-level error fallback with a retry action and a link home. */
export default function Error({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  // `unstable_retry` (Next 16.2+) re-fetches and re-renders the segment; `reset`
  // is the older name. Accept both so this works across patch versions.
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    // Surface the error to logging/monitoring.
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset ?? (() => {});

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <p className="text-5xl font-bold tracking-tight text-neutral-300 dark:text-neutral-700">
        !
      </p>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      {error.digest ? (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
