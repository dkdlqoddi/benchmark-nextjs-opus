import { computeStats } from "../lib/streak";
import { shiftKey } from "../lib/date";

const TODAY = "2026-07-02";

/** Inclusive range of date keys from `start` to `end`. */
function range(start: string, end: string): string[] {
  const out: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    out.push(cursor);
    cursor = shiftKey(cursor, 1);
  }
  return out;
}

const cases: Array<{
  name: string;
  dates: string[];
  current: number;
  longest: number;
}> = [
  {
    name: "1. [7/1, 7/2]",
    dates: ["2026-07-01", "2026-07-02"],
    current: 2,
    longest: 2,
  },
  {
    name: "2. [6/30, 7/1]",
    dates: ["2026-06-30", "2026-07-01"],
    current: 2,
    longest: 2,
  },
  {
    name: "3. [6/29, 6/30]",
    dates: ["2026-06-29", "2026-06-30"],
    current: 0,
    longest: 2,
  },
  {
    name: "4. []",
    dates: [],
    current: 0,
    longest: 0,
  },
  {
    name: "5. [6/1-6/10, 6/20-7/2]",
    dates: [
      ...range("2026-06-01", "2026-06-10"),
      ...range("2026-06-20", "2026-07-02"),
    ],
    current: 13,
    longest: 13,
  },
];

let allPassed = true;
console.log(`today = ${TODAY}\n`);
for (const testCase of cases) {
  const stats = computeStats(testCase.dates, TODAY);
  const passed =
    stats.current === testCase.current && stats.longest === testCase.longest;
  allPassed = allPassed && passed;
  console.log(
    `${passed ? "PASS" : "FAIL"}  ${testCase.name}  ->  ` +
      `current=${stats.current} (expected ${testCase.current}), ` +
      `longest=${stats.longest} (expected ${testCase.longest}), ` +
      `total=${stats.total}`,
  );
}
console.log(
  allPassed ? "\nAll streak cases passed." : "\nSome streak cases FAILED.",
);
process.exit(allPassed ? 0 : 1);
