import type { Habit } from "@prisma/client";

/** Renders a single habit as a card showing its color, name, and description. */
export function HabitCard({ habit }: { habit: Habit }) {
  return (
    <article className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
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
    </article>
  );
}
