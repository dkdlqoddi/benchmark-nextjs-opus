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

export type WeekRate = {
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (inclusive)
  checkIns: number;
  possible: number;
  rate: number; // 0..100, rounded
};

/**
 * Weekly completion rates over the last `weeks` 7-day windows ending on `today`.
 * Each window's rate = check-ins in the window / (habitCount * 7) as a rounded
 * percentage. `dates` is every habit's check-in keys (duplicate dates across
 * different habits are expected and counted). Returned oldest-first. Pure.
 */
export function weeklyCompletionRates(
  dates: string[],
  today: string,
  habitCount: number,
  weeks = 8,
): WeekRate[] {
  const result: WeekRate[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = shiftKey(today, -7 * w);
    const start = shiftKey(end, -6);
    const checkIns = dates.filter((d) => d >= start && d <= end).length;
    const possible = habitCount * 7;
    const rate = possible > 0 ? Math.round((checkIns / possible) * 100) : 0;
    result.push({ start, end, checkIns, possible, rate });
  }
  return result;
}
