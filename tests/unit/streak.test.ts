import { describe, expect, it } from "vitest";
import {
  computeStats,
  currentStreak,
  longestStreak,
  weeklyCompletionRates,
} from "@/lib/streak";
import { shiftKey, weekdayOfKey } from "@/lib/date";
import { EVERY_DAY, isTargetWeekday, weekdaysToMask } from "@/lib/target-days";

// Streaks are pure functions of (check-in keys, "today", target-day mask). The
// reference "today" for most cases is a Thursday (weekday 4); nearby weekdays:
//   Fri 6/26, Sat 6/27, Sun 6/28, Mon 6/29, Tue 6/30, Wed 7/1, Thu 7/2 (today).
const TODAY = "2026-07-02";

const MON_WED_FRI = weekdaysToMask([1, 3, 5]); // 42
const TUE_THU = weekdaysToMask([2, 4]); // 20
const WEEKDAYS = weekdaysToMask([1, 2, 3, 4, 5]); // 62 (Mon–Fri)
const WEEKENDS = weekdaysToMask([0, 6]); // 65 (Sun + Sat)
const THU_ONLY = weekdaysToMask([4]); // 16

/** All target days (for `mask`) in the inclusive range [start, end]. */
function targetRange(start: string, end: string, mask: number): string[] {
  const out: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    if (isTargetWeekday(mask, weekdayOfKey(cursor))) out.push(cursor);
    cursor = shiftKey(cursor, 1);
  }
  return out;
}

type StreakCase = {
  name: string;
  mask: number;
  dates: string[];
  today: string;
  current: number;
  longest: number;
};

// The first ten cases are the ones formerly asserted by scripts/verify-streak.ts
// (now deleted); the rest add year-boundary, leap-day, and target-day-combo edge
// cases. Every expected value was confirmed against the real implementation.
const cases: StreakCase[] = [
  // --- Every day (127): behaves exactly like the old calendar-day streak. ---
  {
    name: "every day, [Wed 7/1, Thu 7/2]",
    mask: EVERY_DAY,
    dates: ["2026-07-01", "2026-07-02"],
    today: TODAY,
    current: 2,
    longest: 2,
  },
  {
    name: "every day, [Tue 6/30, Wed 7/1] (today unchecked → grace)",
    mask: EVERY_DAY,
    dates: ["2026-06-30", "2026-07-01"],
    today: TODAY,
    current: 2,
    longest: 2,
  },
  {
    name: "every day, [] (nothing)",
    mask: EVERY_DAY,
    dates: [],
    today: TODAY,
    current: 0,
    longest: 0,
  },
  {
    name: "every day, [Mon 6/29, Tue 6/30] (gap before today)",
    mask: EVERY_DAY,
    dates: ["2026-06-29", "2026-06-30"],
    today: TODAY,
    current: 0,
    longest: 2,
  },

  // --- Mon/Wed/Fri (42): only target days count; today (Thu) is not a target. ---
  {
    name: "Mon/Wed/Fri, [Mon 6/29, Wed 7/1] (Tue skipped, not a target)",
    mask: MON_WED_FRI,
    dates: ["2026-06-29", "2026-07-01"],
    today: TODAY,
    current: 2,
    longest: 2,
  },
  {
    name: "Mon/Wed/Fri, [Tue 6/30, Wed 7/1] (Tue check-in doesn't count)",
    mask: MON_WED_FRI,
    dates: ["2026-06-30", "2026-07-01"],
    today: TODAY,
    current: 1,
    longest: 1,
  },
  {
    name: "Mon/Wed/Fri, every target day 6/8–7/1 (11 in a row)",
    mask: MON_WED_FRI,
    dates: targetRange("2026-06-08", "2026-07-01", MON_WED_FRI),
    today: TODAY,
    current: 11,
    longest: 11,
  },
  {
    name: "Mon/Wed/Fri, 6/8–7/1 but missing Wed 6/17 (breaks the run)",
    mask: MON_WED_FRI,
    dates: targetRange("2026-06-08", "2026-07-01", MON_WED_FRI).filter(
      (d) => d !== "2026-06-17",
    ),
    today: TODAY,
    current: 6,
    longest: 6,
  },

  // --- Tue/Thu (20): today (Thu) IS a target day. ---
  {
    name: "Tue/Thu, [Tue 6/30, Thu 7/2] (today checked)",
    mask: TUE_THU,
    dates: ["2026-06-30", "2026-07-02"],
    today: TODAY,
    current: 2,
    longest: 2,
  },
  {
    name: "Tue/Thu, [Thu 6/25, Tue 6/30] (today unchecked target → grace)",
    mask: TUE_THU,
    dates: ["2026-06-25", "2026-06-30"],
    today: TODAY,
    current: 2,
    longest: 2,
  },

  // --- Target-day combinations: weekend-skipping and weekly cadences. ---
  {
    name: "Weekdays, [Fri 6/26 → Thu 7/2] (run skips the weekend)",
    mask: WEEKDAYS,
    dates: [
      "2026-06-26",
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
    ],
    today: TODAY,
    current: 5,
    longest: 5,
  },
  {
    name: "Weekends, [Sat 6/27, Sun 6/28] (today Thu is an off day)",
    mask: WEEKENDS,
    dates: ["2026-06-27", "2026-06-28"],
    today: TODAY,
    current: 2,
    longest: 2,
  },
  {
    name: "Thursday-only, [Thu 6/25, Thu 7/2] (consecutive weeks)",
    mask: THU_ONLY,
    dates: ["2026-06-25", "2026-07-02"],
    today: TODAY,
    current: 2,
    longest: 2,
  },
  {
    name: "Thursday-only, [Thu 6/18, Thu 7/2] (a week missed breaks it)",
    mask: THU_ONLY,
    dates: ["2026-06-18", "2026-07-02"],
    today: TODAY,
    current: 1,
    longest: 1,
  },
  {
    name: "Thursday-only, [Thu 6/25] (today's Thu unchecked → grace)",
    mask: THU_ONLY,
    dates: ["2026-06-25"],
    today: TODAY,
    current: 1,
    longest: 1,
  },
  {
    name: "empty mask (0): no weekday is a target",
    mask: 0,
    dates: ["2026-07-01", "2026-07-02"],
    today: TODAY,
    current: 0,
    longest: 0,
  },
  {
    name: "Mon/Wed/Fri with only non-target check-ins (Tue, Thu)",
    mask: MON_WED_FRI,
    dates: ["2026-06-30", "2026-07-02"],
    today: TODAY,
    current: 0,
    longest: 0,
  },

  // --- Year boundary: Dec → Jan must be contiguous. ---
  {
    name: "year boundary, [2026-12-31, 2027-01-01]",
    mask: EVERY_DAY,
    dates: ["2026-12-31", "2027-01-01"],
    today: "2027-01-01",
    current: 2,
    longest: 2,
  },
  {
    name: "year boundary with a gap (missing 2027-01-01)",
    mask: EVERY_DAY,
    dates: ["2026-12-30", "2026-12-31", "2027-01-02"],
    today: "2027-01-02",
    current: 1,
    longest: 2,
  },

  // --- Leap day: Feb 29 exists in 2028 and must be part of the run. ---
  {
    name: "leap day, [2028-02-28, 2028-02-29, 2028-03-01]",
    mask: EVERY_DAY,
    dates: ["2028-02-28", "2028-02-29", "2028-03-01"],
    today: "2028-03-01",
    current: 3,
    longest: 3,
  },
  {
    name: "leap day skipped (Feb 29 missing) breaks the run",
    mask: EVERY_DAY,
    dates: ["2028-02-28", "2028-03-01"],
    today: "2028-03-01",
    current: 1,
    longest: 1,
  },
  {
    name: "non-leap Feb: 2027-02-28 is the day before 2027-03-01",
    mask: EVERY_DAY,
    dates: ["2027-02-28", "2027-03-01"],
    today: "2027-03-01",
    current: 2,
    longest: 2,
  },
];

describe("currentStreak / longestStreak", () => {
  it.each(cases)("$name", ({ dates, today, mask, current, longest }) => {
    expect(currentStreak(dates, today, mask)).toBe(current);
    expect(longestStreak(dates, mask)).toBe(longest);
  });
});

describe("computeStats", () => {
  it("bundles current, longest, and total (= number of check-ins)", () => {
    const dates = ["2026-06-30", "2026-07-01", "2026-07-02"];
    expect(computeStats(dates, TODAY, EVERY_DAY)).toEqual({
      current: 3,
      longest: 3,
      total: 3,
    });
  });

  it("counts every check-in in total, even non-target/off-streak ones", () => {
    // Two Mon/Wed/Fri check-ins plus a Tuesday that never counts for streaks.
    const dates = ["2026-06-29", "2026-06-30", "2026-07-01"];
    const stats = computeStats(dates, TODAY, MON_WED_FRI);
    expect(stats.total).toBe(3);
    expect(stats.current).toBe(2);
    expect(stats.longest).toBe(2);
  });
});

describe("weeklyCompletionRates", () => {
  it("computes a single 7-day window rate (rounded percentage)", () => {
    const rates = weeklyCompletionRates(
      ["2026-07-02", "2026-07-01", "2026-06-26", "2026-06-25"],
      TODAY,
      1,
      1,
    );
    // Window is [6/26, 7/2]; 6/25 falls outside it. 3 of 7 possible → 43%.
    expect(rates).toEqual([
      {
        start: "2026-06-26",
        end: "2026-07-02",
        checkIns: 3,
        possible: 7,
        rate: 43,
      },
    ]);
  });

  it("returns rate 0 (avoiding divide-by-zero) when there are no habits", () => {
    const [week] = weeklyCompletionRates(["2026-07-02"], TODAY, 0, 1);
    expect(week.possible).toBe(0);
    expect(week.rate).toBe(0);
  });

  it("returns `weeks` windows oldest-first, ending on today", () => {
    const rates = weeklyCompletionRates([], TODAY, 1, 8);
    expect(rates).toHaveLength(8);
    expect(rates[0].end).toBe(shiftKey(TODAY, -49));
    expect(rates[7].end).toBe(TODAY);
  });
});
