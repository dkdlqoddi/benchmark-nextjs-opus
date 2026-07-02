import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist.",
};

/**
 * Custom 404. Rendered both for `notFound()` calls (e.g. a habit that isn't
 * yours) and for any unmatched URL across the app. Renders inside the root
 * layout, so the nav is present when signed in.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <p className="text-6xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
        404
      </p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}
