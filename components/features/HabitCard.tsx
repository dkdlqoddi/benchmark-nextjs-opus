import Link from "next/link";
import type { Habit } from "@prisma/client";
import { archiveHabit } from "@/actions/habits";
import { toggleToday } from "@/actions/check-ins";
import { describeMask } from "@/lib/target-days";
import { readableOnColorClass } from "@/lib/colors";

type HabitCardProps = {
  habit: Habit;
  checkedToday: boolean;
  isTargetToday: boolean;
  tags: { id: string; name: string }[];
};

/** Habit card with a check-in-today toggle plus links to detail, edit, and archive. */
export function HabitCard({
  habit,
  checkedToday,
  isTargetToday,
  tags,
}: HabitCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex gap-3">
        {/* The swatch color is habit data, not a design token, so it is applied inline. */}
        <span
          aria-hidden
          className="mt-1 h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: habit.color }}
        />
        <div className="min-w-0">
          <Link
            href={`/habits/${habit.id}`}
            className="block truncate font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
          >
            {habit.name}
          </Link>
          {habit.description ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {habit.description}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-neutral-500">
            {describeMask(habit.targetDays)}
            {isTargetToday ? "" : " · off day today"}
          </p>
          {tags.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    href={`/?tag=${encodeURIComponent(tag.name)}`}
                    className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <form action={toggleToday.bind(null, habit.id)}>
        <button
          type="submit"
          aria-pressed={checkedToday}
          title={isTargetToday ? undefined : "Not a target day today"}
          className={`w-full rounded-md border px-3 py-2 text-sm font-medium transition ${
            checkedToday
              ? `border-transparent ${readableOnColorClass(habit.color)}`
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          } ${!isTargetToday && !checkedToday ? "opacity-50" : ""}`}
          style={checkedToday ? { backgroundColor: habit.color } : undefined}
        >
          {checkedToday ? "✓ Checked in today" : "Check in today"}
        </button>
      </form>

      <div className="flex items-center gap-1 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <Link
          href={`/habits/${habit.id}`}
          className="rounded-md px-2.5 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Calendar
        </Link>
        <Link
          href={`/habits/${habit.id}/edit`}
          className="rounded-md px-2.5 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
        >
          Edit
        </Link>
        <form action={archiveHabit.bind(null, habit.id)}>
          <button
            type="submit"
            className="rounded-md px-2.5 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Archive
          </button>
        </form>
      </div>
    </article>
  );
}
