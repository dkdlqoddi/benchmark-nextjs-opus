import Link from "next/link";
import type { Habit } from "@prisma/client";
import { archiveHabit } from "@/actions/habits";

/** Renders a habit card with its color, name, description, and edit/archive actions. */
export function HabitCard({ habit }: { habit: Habit }) {
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
          <h3 className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
            {habit.name}
          </h3>
          {habit.description ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {habit.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-neutral-100 pt-3 dark:border-neutral-800">
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
