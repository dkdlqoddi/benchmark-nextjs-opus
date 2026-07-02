import { shiftKey } from "./date";

/**
 * Streak statistics for a habit. Pure functions only — all "today" context is
 * passed in as a YYYY-MM-DD key so results are deterministic and testable.
 * Inputs are check-in date keys (YYYY-MM-DD) and are assumed to be duplicate-free.
 */

export type HabitStats = {
  current: number;
  longest: number;
  total: number;
};

/** Longest run of consecutive dates among the check-in keys. Pure. */
export function longestStreak(dates: string[]): number {
  const set = new Set(dates);
  let longest = 0;
  for (const date of set) {
    // Only begin counting from the first day of a run.
    if (set.has(shiftKey(date, -1))) continue;
    let length = 1;
    let cursor = date;
    while (set.has(shiftKey(cursor, 1))) {
      cursor = shiftKey(cursor, 1);
      length++;
    }
    if (length > longest) longest = length;
  }
  return longest;
}

/**
 * Current streak relative to `today`: the run of consecutive check-ins ending at
 * today, or ending at yesterday when today has no check-in yet. Returns 0 when
 * neither today nor yesterday is checked in. Pure.
 */
export function currentStreak(dates: string[], today: string): number {
  const set = new Set(dates);

  let anchor: string;
  if (set.has(today)) {
    anchor = today;
  } else if (set.has(shiftKey(today, -1))) {
    anchor = shiftKey(today, -1);
  } else {
    return 0;
  }

  let length = 0;
  let cursor = anchor;
  while (set.has(cursor)) {
    length++;
    cursor = shiftKey(cursor, -1);
  }
  return length;
}

/** Current streak, longest streak, and total check-ins for a habit. Pure. */
export function computeStats(dates: string[], today: string): HabitStats {
  return {
    current: currentStreak(dates, today),
    longest: longestStreak(dates),
    total: dates.length,
  };
}
