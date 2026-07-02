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
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Your Habits</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {habits.length} active {habits.length === 1 ? "habit" : "habits"}
        </p>
      </header>

      {habits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          No habits yet. Run{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm dark:bg-neutral-800">
            npm run db:seed
          </code>{" "}
          to add sample data.
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
