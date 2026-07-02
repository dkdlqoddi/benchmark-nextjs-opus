import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HabitCard } from "@/components/features/HabitCard";

// Read live database state on every request instead of prerendering at build time.
export const dynamic = "force-dynamic";

/** Home page: renders all active (non-archived) habits as a grid of cards. */
export default async function HomePage() {
  const habits = await prisma.habit.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Habits</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {habits.length} active {habits.length === 1 ? "habit" : "habits"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/habits/archived"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Archived
          </Link>
          <Link
            href="/habits/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            New habit
          </Link>
        </div>
      </header>

      {habits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          No habits yet.{" "}
          <Link
            href="/habits/new"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Create your first habit
          </Link>
          .
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <li key={habit.id}>
              <HabitCard habit={habit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
