import { shiftKey, weekdayOfKey } from "./date";
import { EVERY_DAY, isTargetWeekday } from "./target-days";

/**
 * Streak statistics for a habit. Pure functions only — all "today" context is
 * passed in as a YYYY-MM-DD key so results are deterministic and testable.
 * Inputs are check-in date keys (YYYY-MM-DD) and are assumed to be duplicate-free.
 *
 * Streaks count only a habit's target days (a 7-bit weekday mask; see
 * lib/target-days.ts). A run steps day-to-day over target days, skipping
 * non-target weekdays; check-ins that land on non-target days never extend a
 * streak, and missing a target day breaks it.
 */

export type HabitStats = {
  current: number;
  longest: number;
  total: number;
};

/** The nearest target day strictly before `key` for the given mask. */
function prevTargetKey(key: string, mask: number): string {
  let cursor = shiftKey(key, -1);
  while (!isTargetWeekday(mask, weekdayOfKey(cursor))) {
    cursor = shiftKey(cursor, -1);
  }
  return cursor;
}

/** The nearest target day strictly after `key` for the given mask. */
function nextTargetKey(key: string, mask: number): string {
  let cursor = shiftKey(key, 1);
  while (!isTargetWeekday(mask, weekdayOfKey(cursor))) {
    cursor = shiftKey(cursor, 1);
  }
  return cursor;
}

/** Longest run of consecutive target days that are all checked in. Pure. */
export function longestStreak(dates: string[], mask: number): number {
  if ((mask & EVERY_DAY) === 0) return 0;
  // Only check-ins that fall on a target day can be part of a streak.
  const set = new Set(
    dates.filter((date) => isTargetWeekday(mask, weekdayOfKey(date))),
  );
  let longest = 0;
  for (const date of set) {
    // Only begin counting from the first target day of a run.
    if (set.has(prevTargetKey(date, mask))) continue;
    let length = 1;
    let cursor = date;
    while (set.has(nextTargetKey(cursor, mask))) {
      cursor = nextTargetKey(cursor, mask);
      length++;
    }
    if (length > longest) longest = length;
  }
  return longest;
}

/**
 * Current streak relative to `today`, counting only target days: the run of
 * consecutive checked target days ending at the most recent target day on or
 * before today. If today is itself a target day that has not been checked yet,
 * the run may end at the previous target day (today is still "open"). Returns 0
 * when the most recent relevant target day is not checked. Pure.
 */
export function currentStreak(
  dates: string[],
  today: string,
  mask: number,
): number {
  if ((mask & EVERY_DAY) === 0) return 0;
  const set = new Set(dates);

  // Anchor at the most recent target day on or before today.
  let anchor = isTargetWeekday(mask, weekdayOfKey(today))
    ? today
    : prevTargetKey(today, mask);
  if (!set.has(anchor)) {
    // If today itself is an as-yet-unchecked target day, fall back to the
    // previous target day (today is still open); otherwise the streak is broken.
    if (anchor !== today) return 0;
    anchor = prevTargetKey(today, mask);
    if (!set.has(anchor)) return 0;
  }

  let length = 0;
  let cursor = anchor;
  while (set.has(cursor)) {
    length++;
    cursor = prevTargetKey(cursor, mask);
  }
  return length;
}

/** Current streak, longest streak, and total check-ins for a habit. Pure. */
export function computeStats(
  dates: string[],
  today: string,
  mask: number,
): HabitStats {
  return {
    current: currentStreak(dates, today, mask),
    longest: longestStreak(dates, mask),
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
