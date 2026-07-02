import { computeStats } from "../lib/streak";
import { shiftKey, weekdayOfKey } from "../lib/date";
import {
  EVERY_DAY,
  describeMask,
  isTargetWeekday,
  weekdaysToMask,
} from "../lib/target-days";

// TODAY is a Thursday (weekday 4). Weekdays of nearby dates:
//   Mon 6/29, Tue 6/30, Wed 7/1, Thu 7/2, Fri 7/3.
const TODAY = "2026-07-02";

const MON_WED_FRI = weekdaysToMask([1, 3, 5]); // 42
const TUE_THU = weekdaysToMask([2, 4]); // 20

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

const cases: Array<{
  name: string;
  mask: number;
  dates: string[];
  current: number;
  longest: number;
}> = [
  // --- Every day (127): behaves exactly like the old calendar-day streak. ---
  {
    name: "1. every day, [Wed 7/1, Thu 7/2]",
    mask: EVERY_DAY,
    dates: ["2026-07-01", "2026-07-02"],
    current: 2,
    longest: 2,
  },
  {
    name: "2. every day, [Tue 6/30, Wed 7/1] (today unchecked → grace)",
    mask: EVERY_DAY,
    dates: ["2026-06-30", "2026-07-01"],
    current: 2,
    longest: 2,
  },
  {
    name: "3. every day, [] (nothing)",
    mask: EVERY_DAY,
    dates: [],
    current: 0,
    longest: 0,
  },
  {
    name: "4. every day, [Mon 6/29, Tue 6/30] (gap before today)",
    mask: EVERY_DAY,
    dates: ["2026-06-29", "2026-06-30"],
    current: 0,
    longest: 2,
  },

  // --- Mon/Wed/Fri (42): only target days count; today (Thu) is not a target. ---
  {
    name: "5. Mon/Wed/Fri, [Mon 6/29, Wed 7/1] (Tue skipped, not a target)",
    mask: MON_WED_FRI,
    dates: ["2026-06-29", "2026-07-01"],
    current: 2,
    longest: 2,
  },
  {
    name: "6. Mon/Wed/Fri, [Tue 6/30, Wed 7/1] (Tue check-in doesn't count)",
    mask: MON_WED_FRI,
    dates: ["2026-06-30", "2026-07-01"],
    current: 1,
    longest: 1,
  },
  {
    name: "7. Mon/Wed/Fri, every target day 6/8–7/1 (11 in a row)",
    mask: MON_WED_FRI,
    dates: targetRange("2026-06-08", "2026-07-01", MON_WED_FRI),
    current: 11,
    longest: 11,
  },
  {
    name: "8. Mon/Wed/Fri, 6/8–7/1 but missing Wed 6/17 (breaks the run)",
    mask: MON_WED_FRI,
    dates: targetRange("2026-06-08", "2026-07-01", MON_WED_FRI).filter(
      (d) => d !== "2026-06-17",
    ),
    current: 6,
    longest: 6,
  },

  // --- Tue/Thu (20): today (Thu) IS a target day. ---
  {
    name: "9. Tue/Thu, [Tue 6/30, Thu 7/2] (today checked)",
    mask: TUE_THU,
    dates: ["2026-06-30", "2026-07-02"],
    current: 2,
    longest: 2,
  },
  {
    name: "10. Tue/Thu, [Thu 6/25, Tue 6/30] (today unchecked target → grace)",
    mask: TUE_THU,
    dates: ["2026-06-25", "2026-06-30"],
    current: 2,
    longest: 2,
  },
];

let allPassed = true;
console.log(`today = ${TODAY} (Thursday)\n`);
for (const testCase of cases) {
  const stats = computeStats(testCase.dates, TODAY, testCase.mask);
  const passed =
    stats.current === testCase.current && stats.longest === testCase.longest;
  allPassed = allPassed && passed;
  console.log(
    `${passed ? "PASS" : "FAIL"}  ${testCase.name}  [${describeMask(testCase.mask)}]  ->  ` +
      `current=${stats.current} (expected ${testCase.current}), ` +
      `longest=${stats.longest} (expected ${testCase.longest}), ` +
      `total=${stats.total}`,
  );
}
console.log(
  allPassed ? "\nAll streak cases passed." : "\nSome streak cases FAILED.",
);
process.exit(allPassed ? 0 : 1);
