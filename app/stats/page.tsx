import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeStats, weeklyCompletionRates } from "@/lib/streak";
import { getTodayKey } from "@/lib/date";
import { WeeklyCompletionChart } from "@/components/features/WeeklyCompletionChart";

// Read live database state on every request instead of prerendering at build time.
export const dynamic = "force-dynamic";

/** Stats page: weekly completion-rate chart + per-habit streaks/totals. */
export default async function StatsPage() {
  const habits = await prisma.habit.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "asc" },
  });
  const checkIns = await prisma.checkIn.findMany({
    where: { habitId: { in: habits.map((h) => h.id) } },
    select: { habitId: true, date: true },
  });

  const datesByHabit = new Map<string, string[]>();
  for (const checkIn of checkIns) {
    const list = datesByHabit.get(checkIn.habitId) ?? [];
    list.push(checkIn.date);
    datesByHabit.set(checkIn.habitId, list);
  }

  const today = getTodayKey();
  const weekly = weeklyCompletionRates(
    checkIns.map((c) => c.date),
    today,
    habits.length,
    8,
  );
  const chartData = weekly.map((w) => ({
    label: `${Number(w.start.slice(5, 7))}/${Number(w.start.slice(8, 10))}`,
    rate: w.rate,
    checkIns: w.checkIns,
    possible: w.possible,
  }));

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Stats</h1>

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
        <div className="flex flex-col gap-8">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-semibold">Weekly completion rate</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Last 8 weeks · check-ins ÷ (active habits × 7 days)
            </p>
            <div className="mt-4">
              <WeeklyCompletionChart data={chartData} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Habit</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Current streak
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Longest streak
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Total check-ins
                  </th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => {
                  const stats = computeStats(
                    datesByHabit.get(habit.id) ?? [],
                    today,
                  );
                  return (
                    <tr
                      key={habit.id}
                      className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/habits/${habit.id}`}
                          className="flex items-center gap-2 font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                        >
                          <span
                            aria-hidden
                            className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: habit.color }}
                          />
                          <span className="truncate">{habit.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {stats.current} {stats.current === 1 ? "day" : "days"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {stats.longest} {stats.longest === 1 ? "day" : "days"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {stats.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
