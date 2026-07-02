import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { HabitCard } from "@/components/features/HabitCard";
import { getTodayKey, weekdayOfKey } from "@/lib/date";
import { isTargetWeekday } from "@/lib/target-days";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // `app/page.tsx` shares the root segment with the layout that defines the title
  // template, so the template doesn't apply here — set the full title explicitly.
  title: { absolute: "Your Habits · HabitLog" },
  description:
    "All your active habits at a glance — search, filter by tag, and check in for today.",
};

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

/** Builds a home-page URL that carries the given search + tag filters. */
function homeHref(params: { q?: string; tag?: string }): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.tag) sp.set("tag", params.tag);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

/**
 * Home page: the user's active habits as cards, searchable by text (?q=) and
 * filterable by tag (?tag=). Search matches a habit's name, description, or tag
 * names; the two filters combine.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const activeTag = params.tag;
  const q = (params.q ?? "").trim();

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
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { tags: { some: { name: { contains: q } } } },
            ],
          }
        : {}),
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

  const noun = habits.length === 1 ? "habit" : "habits";
  const scope: string[] = [];
  if (activeTag) scope.push(`tagged “${activeTag}”`);
  if (q) scope.push(`matching “${q}”`);
  const summary = scope.length
    ? `${habits.length} ${noun} ${scope.join(" ")}`
    : `${habits.length} active ${noun}`;

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Habits</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {summary}
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

      {/* Native GET form: submitting navigates to /?q=…, preserving the tag filter. */}
      <form
        action="/"
        method="get"
        role="search"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        {activeTag ? (
          <input type="hidden" name="tag" value={activeTag} />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search habits…"
          aria-label="Search habits"
          className="w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Search
        </button>
        {q ? (
          <Link
            href={homeHref({ tag: activeTag })}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {tags.length > 0 ? (
        <nav
          aria-label="Filter habits by tag"
          className="mb-6 flex flex-wrap gap-2"
        >
          <Link
            href={homeHref({ q })}
            aria-current={activeTag ? undefined : "page"}
            className={tagChipClass(!activeTag)}
          >
            All
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={homeHref({ q, tag: tag.name })}
              aria-current={activeTag === tag.name ? "page" : undefined}
              className={tagChipClass(activeTag === tag.name)}
            >
              {tag.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {habits.length === 0 ? (
        q ? (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
            No habits match “{q}”{activeTag ? ` in “${activeTag}”` : ""}.{" "}
            <Link
              href={homeHref({ tag: activeTag })}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear search
            </Link>
            .
          </p>
        ) : activeTag ? (
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
