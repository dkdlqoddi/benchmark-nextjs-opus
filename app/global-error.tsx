"use client";
// Client Component: error boundaries must run on the client. `global-error`
// replaces the root layout when the layout (or template) itself throws, so it
// must render its own <html>/<body> and pull in global styles.

import { useEffect } from "react";
import "./globals.css";

/** Whole-app error fallback used when the root layout fails to render. */
export default function GlobalError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    // Surface the root-layout error to logging/monitoring.
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset ?? (() => {});

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {/* React hoists <title> into <head>; metadata exports aren't allowed here. */}
        <title>Something went wrong · HabitLog</title>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            HabitLog hit an unexpected error. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
