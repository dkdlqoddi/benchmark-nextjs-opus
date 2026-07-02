import { toggleCheckIn } from "@/actions/check-ins";
import { buildMonthGrid, WEEKDAY_LABELS, weekdayOfKey } from "@/lib/date";
import { isTargetWeekday } from "@/lib/target-days";
import { readableOnColorClass } from "@/lib/colors";

type CalendarMonthProps = {
  habitId: string;
  color: string;
  year: number;
  month: number;
  checkedKeys: string[];
  todayKey: string;
  targetDays: number;
};

/**
 * Monthly calendar grid. Checked days are filled with the habit's color, the
 * current day is ringed, future days are disabled, and non-target weekdays are
 * dimmed (but still clickable — you can check in on any past/today date).
 */
export function CalendarMonth({
  habitId,
  color,
  year,
  month,
  checkedKeys,
  todayKey,
  targetDays,
}: CalendarMonthProps) {
  const checked = new Set(checkedKeys);
  const cells = buildMonthGrid(year, month);

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
        {WEEKDAY_LABELS.map((label, weekday) => (
          <div
            key={label}
            className={`py-1 ${isTargetWeekday(targetDays, weekday) ? "" : "opacity-40"}`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) return <div key={`pad-${index}`} aria-hidden />;

          const isChecked = checked.has(cell.key);
          const isToday = cell.key === todayKey;
          const isFuture = cell.key > todayKey;
          const isTarget = isTargetWeekday(targetDays, weekdayOfKey(cell.key));

          if (isFuture) {
            return (
              <div
                key={cell.key}
                aria-disabled="true"
                className="flex aspect-square items-center justify-center rounded-md border border-neutral-100 text-sm text-neutral-300 dark:border-neutral-800 dark:text-neutral-700"
              >
                {cell.day}
              </div>
            );
          }

          return (
            <form
              key={cell.key}
              action={toggleCheckIn.bind(null, habitId, cell.key)}
            >
              <button
                type="submit"
                aria-pressed={isChecked}
                aria-label={`${isChecked ? "Uncheck" : "Check in"} ${cell.key}${isTarget ? "" : " (non-target day)"}`}
                title={isTarget ? undefined : "Not a target day"}
                className={`flex aspect-square w-full items-center justify-center rounded-md border text-sm transition ${
                  isChecked
                    ? `border-transparent font-semibold ${readableOnColorClass(color)}`
                    : "border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                } ${isToday ? "ring-2 ring-inset ring-blue-500" : ""} ${
                  !isTarget && !isChecked ? "opacity-40" : ""
                }`}
                style={isChecked ? { backgroundColor: color } : undefined}
              >
                {cell.day}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
