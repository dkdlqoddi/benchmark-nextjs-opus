import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarMonth } from "@/components/features/CalendarMonth";
import { prisma } from "@/lib/prisma";
import {
  addMonths,
  currentMonth,
  getTodayKey,
  monthKey,
  monthLabel,
  parseMonthKey,
} from "@/lib/date";

// Read live database state on every request instead of prerendering at build time.
export const dynamic = "force-dynamic";

/** Habit detail page: a monthly check-in calendar with prev/next navigation. */
export default async function HabitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;

  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit) {
    notFound();
  }

  const { year, month } = parseMonthKey(monthParam, currentMonth());
  const checkIns = await prisma.checkIn.findMany({
    where: { habitId: habit.id, date: { startsWith: monthKey(year, month) } },
    select: { date: true },
  });
  const totalCheckIns = await prisma.checkIn.count({
    where: { habitId: habit.id },
  });

  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);

  return (
    <section className="mx-auto max-w-md">
      <Link
        href="/"
        className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        ← Back to home
      </Link>

      <header className="mt-3 mb-6 flex items-start gap-3">
        <span
          aria-hidden
          className="mt-1.5 h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: habit.color }}
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{habit.name}</h1>
          {habit.description ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {habit.description}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-neutral-500">
            {totalCheckIns} total check-in{totalCheckIns === 1 ? "" : "s"}
            {habit.archivedAt ? " · archived" : ""}
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/habits/${habit.id}?month=${monthKey(prev.year, prev.month)}`}
            aria-label="Previous month"
            className="rounded-md px-2 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            ← Prev
          </Link>
          <h2 className="text-sm font-semibold">{monthLabel(year, month)}</h2>
          <Link
            href={`/habits/${habit.id}?month=${monthKey(next.year, next.month)}`}
            aria-label="Next month"
            className="rounded-md px-2 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Next →
          </Link>
        </div>

        <CalendarMonth
          habitId={habit.id}
          color={habit.color}
          year={year}
          month={month}
          checkedKeys={checkIns.map((c) => c.date)}
          todayKey={getTodayKey()}
        />
      </div>
    </section>
  );
}
