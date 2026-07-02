/**
 * Date utilities for HabitLog. All "today"/timezone logic is centralized here
 * and fixed to Asia/Seoul, so check-in dates are consistent regardless of where
 * the server runs. Dates are stored and compared as YYYY-MM-DD strings, which
 * sort chronologically as plain strings.
 */

export const TIME_ZONE = "Asia/Seoul";

/** Returns the year/month/day of an instant, evaluated in Asia/Seoul. */
function seoulParts(instant: Date): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

/** Formats a YYYY-MM-DD key from calendar parts (month is 1-12). */
export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Formats an instant as a YYYY-MM-DD key in Asia/Seoul. */
export function toDateKey(instant: Date): string {
  const { year, month, day } = seoulParts(instant);
  return dateKey(year, month, day);
}

/** Today's date key (YYYY-MM-DD) in Asia/Seoul. */
export function getTodayKey(): string {
  return toDateKey(new Date());
}

/** The current year/month in Asia/Seoul (month is 1-12). */
export function currentMonth(): { year: number; month: number } {
  const { year, month } = seoulParts(new Date());
  return { year, month };
}

/** Formats a "YYYY-MM" month key (month is 1-12). */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Parses a "YYYY-MM" value, falling back when it is missing or invalid. */
export function parseMonthKey(
  value: string | undefined,
  fallback: { year: number; month: number },
): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    if (month >= 1 && month <= 12) return { year, month };
  }
  return fallback;
}

/** Returns the year/month `delta` months away from the given one (month 1-12). */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** A human-readable month label such as "July 2026". */
export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Number of days in a month (month is 1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Weekday index (0=Sunday .. 6=Saturday) of a calendar date (month is 1-12). */
export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Shifts a YYYY-MM-DD key by a number of days (may be negative). */
export function shiftKey(key: string, deltaDays: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return dateKey(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

export type MonthCell = { day: number; key: string } | null;

/**
 * Builds a calendar grid for a month as a flat array of cells, with leading and
 * trailing nulls padding to whole weeks. Render with a 7-column grid. Month 1-12.
 */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const leading = weekdayOf(year, month, 1);
  const total = daysInMonth(year, month);
  const cells: MonthCell[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let day = 1; day <= total; day++) {
    cells.push({ day, key: dateKey(year, month, day) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Ordered weekday labels for the calendar header (Sunday first). */
export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;
