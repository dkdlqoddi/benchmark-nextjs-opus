import Link from "next/link";
import { restoreHabit } from "@/actions/habits";
import { DeleteHabitButton } from "@/components/features/DeleteHabitButton";
import { prisma } from "@/lib/prisma";

// Read live database state on every request instead of prerendering at build time.
export const dynamic = "force-dynamic";

/** Archived habits list with restore and permanent-delete actions. */
export default async function ArchivedHabitsPage() {
  const habits = await prisma.habit.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
  });

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Archived Habits</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {habits.length} archived
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Back to home
        </Link>
      </header>

      {habits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          No archived habits.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span
                aria-hidden
                className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: habit.color }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                  {habit.name}
                </h3>
                {habit.description ? (
                  <p className="mt-1 truncate text-sm text-neutral-600 dark:text-neutral-400">
                    {habit.description}
                  </p>
                ) : null}
              </div>
              <form action={restoreHabit.bind(null, habit.id)}>
                <button
                  type="submit"
                  className="rounded-md px-2.5 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  Restore
                </button>
              </form>
              <DeleteHabitButton id={habit.id} name={habit.name} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
