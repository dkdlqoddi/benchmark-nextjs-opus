import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { HabitCard } from "@/components/features/HabitCard";
import { getTodayKey, weekdayOfKey } from "@/lib/date";
import { isTargetWeekday } from "@/lib/target-days";

// Read live database state on every request instead of prerendering at build time.
export const dynamic = "force-dynamic";

/** Tailwind classes for a tag filter chip (active = filled). */
function tagChipClass(active: boolean): string {
  return `rounded-full px-3 py-1 text-sm font-medium transition-colors ${
    active
      ? "bg-blue-600 text-white"
      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
  }`;
}

/** Home page: the user's active habits as cards, filterable by tag (?tag=name). */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const userId = await requireUserId();
  const { tag: activeTag } = await searchParams;

  // Tags attached to at least one active habit — the options in the filter bar.
  const tags = await prisma.tag.findMany({
    where: { userId, habits: { some: { archivedAt: null } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const habits = await prisma.habit.findMany({
    where: {
      userId,
      archivedAt: null,
      ...(activeTag ? { tags: { some: { name: activeTag } } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: {
      tags: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });

  const todayKey = getTodayKey();
  const todayWeekday = weekdayOfKey(todayKey);
  const todaysCheckIns = await prisma.checkIn.findMany({
    where: { date: todayKey, habitId: { in: habits.map((h) => h.id) } },
    select: { habitId: true },
  });
  const checkedToday = new Set(todaysCheckIns.map((c) => c.habitId));

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Habits</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {activeTag
              ? `${habits.length} ${habits.length === 1 ? "habit" : "habits"} tagged “${activeTag}”`
              : `${habits.length} active ${habits.length === 1 ? "habit" : "habits"}`}
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

      {tags.length > 0 ? (
        <nav
          aria-label="Filter habits by tag"
          className="mb-6 flex flex-wrap gap-2"
        >
          <Link
            href="/"
            aria-current={activeTag ? undefined : "page"}
            className={tagChipClass(!activeTag)}
          >
            All
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/?tag=${encodeURIComponent(tag.name)}`}
              aria-current={activeTag === tag.name ? "page" : undefined}
              className={tagChipClass(activeTag === tag.name)}
            >
              {tag.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {habits.length === 0 ? (
        activeTag ? (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
            No active habits tagged “{activeTag}”.{" "}
            <Link
              href="/"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Show all
            </Link>
            .
          </p>
        ) : (
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
        )
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <li key={habit.id}>
              <HabitCard
                habit={habit}
                checkedToday={checkedToday.has(habit.id)}
                isTargetToday={isTargetWeekday(habit.targetDays, todayWeekday)}
                tags={habit.tags}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
