import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TIME_ZONE,
  addMonths,
  buildMonthGrid,
  currentMonth,
  dateKey,
  daysInMonth,
  getTodayKey,
  monthKey,
  monthLabel,
  parseMonthKey,
  shiftKey,
  toDateKey,
  weekdayOf,
  weekdayOfKey,
} from "@/lib/date";

// All date logic is fixed to Asia/Seoul (UTC+9, no DST), so an instant's
// calendar day depends on the offset. These tests pin the timezone behaviour
// regardless of where the test runner happens to be.
describe("timezone handling (Asia/Seoul, UTC+9)", () => {
  it("uses the Asia/Seoul zone", () => {
    expect(TIME_ZONE).toBe("Asia/Seoul");
  });

  it("keeps the same day just before the KST midnight boundary", () => {
    // 14:59:59Z is 23:59:59 in Seoul — still the 2nd.
    expect(toDateKey(new Date("2026-07-02T14:59:59Z"))).toBe("2026-07-02");
  });

  it("rolls to the next day at the KST midnight boundary", () => {
    // 15:00Z is 00:00 next day in Seoul — now the 3rd.
    expect(toDateKey(new Date("2026-07-02T15:00:00Z"))).toBe("2026-07-03");
  });

  it("crosses the year boundary in Seoul, not UTC", () => {
    expect(toDateKey(new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01");
    expect(toDateKey(new Date("2026-12-31T14:59:59Z"))).toBe("2026-12-31");
  });

  it("stays on the same day for a UTC-midnight instant (09:00 in Seoul)", () => {
    expect(toDateKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
  });
});

describe("getTodayKey / currentMonth (clock-dependent)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns today's Seoul key across the midnight boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T14:59:00Z"));
    expect(getTodayKey()).toBe("2026-07-02");
    vi.setSystemTime(new Date("2026-07-02T15:00:00Z"));
    expect(getTodayKey()).toBe("2026-07-03");
  });

  it("derives the current Seoul month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T15:00:00Z"));
    expect(currentMonth()).toEqual({ year: 2027, month: 1 });
  });
});

// Regression (p14): a user reported that an 11:55 PM check-in was recorded under
// the next day's date. Check-in dates come from getTodayKey() (Asia/Seoul), so
// these pin the intended midnight-boundary behaviour: a check-in is dated to the
// *Seoul* calendar day of the instant it happens. A viewer in Seoul keeps a
// late-night check-in on the same day; a viewer west of Seoul can see it land on
// the next Seoul day — by design (single fixed zone), not a bug.
describe("regression: midnight-boundary check-in date (p14)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps an 11:55 PM check-in on the same day for a viewer in Seoul", () => {
    // 23:55 KST on 2026-07-02 is 14:55 UTC — before Seoul midnight (15:00 UTC).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T14:55:00Z"));
    expect(getTodayKey()).toBe("2026-07-02");
  });

  it("dates an 11:55 PM check-in to the next Seoul day west of Seoul", () => {
    // 23:55 in a UTC+0 zone is 23:55 UTC — already 08:55 next day in Seoul.
    // This reproduces the report: the check-in is stored under 2026-07-03.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T23:55:00Z"));
    expect(getTodayKey()).toBe("2026-07-03");
  });

  it("switches day exactly at Seoul midnight (15:00 UTC), to the tick", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T14:59:59Z"));
    expect(getTodayKey()).toBe("2026-07-02");
    vi.setSystemTime(new Date("2026-07-02T15:00:00Z"));
    expect(getTodayKey()).toBe("2026-07-03");
  });
});

describe("dateKey formatting", () => {
  it("zero-pads month and day", () => {
    expect(dateKey(2026, 1, 5)).toBe("2026-01-05");
    expect(dateKey(2026, 12, 25)).toBe("2026-12-25");
  });
});

describe("weekday helpers (0 = Sun .. 6 = Sat)", () => {
  it("computes weekday from calendar parts", () => {
    expect(weekdayOf(2026, 7, 1)).toBe(3); // Wednesday
    expect(weekdayOf(2026, 7, 2)).toBe(4); // Thursday
  });

  it("computes weekday from a YYYY-MM-DD key", () => {
    expect(weekdayOfKey("2026-07-02")).toBe(4); // Thursday
    expect(weekdayOfKey("2026-07-05")).toBe(0); // Sunday
  });
});

describe("shiftKey", () => {
  it("shifts within a month", () => {
    expect(shiftKey("2026-07-02", 1)).toBe("2026-07-03");
    expect(shiftKey("2026-07-02", -1)).toBe("2026-07-01");
  });

  it("crosses month and year boundaries", () => {
    expect(shiftKey("2026-07-31", 1)).toBe("2026-08-01");
    expect(shiftKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftKey("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles leap and non-leap February", () => {
    expect(shiftKey("2028-02-28", 1)).toBe("2028-02-29"); // 2028 is a leap year
    expect(shiftKey("2028-02-29", 1)).toBe("2028-03-01");
    expect(shiftKey("2027-02-28", 1)).toBe("2027-03-01"); // 2027 is not
  });
});

describe("daysInMonth", () => {
  it("knows February in leap and non-leap years", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
  });

  it("knows 30- and 31-day months", () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe("addMonths", () => {
  it("rolls forward and backward across year boundaries", () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(2026, 7, 6)).toEqual({ year: 2027, month: 1 });
  });
});

describe("monthKey / monthLabel / parseMonthKey", () => {
  it("formats month keys and labels", () => {
    expect(monthKey(2026, 7)).toBe("2026-07");
    expect(monthLabel(2026, 7)).toBe("July 2026");
  });

  it("parses a valid month key", () => {
    expect(parseMonthKey("2026-07", { year: 1, month: 1 })).toEqual({
      year: 2026,
      month: 7,
    });
  });

  it("falls back for out-of-range, malformed, or missing input", () => {
    const fallback = { year: 2026, month: 7 };
    expect(parseMonthKey("2026-13", fallback)).toEqual(fallback);
    expect(parseMonthKey("nope", fallback)).toEqual(fallback);
    expect(parseMonthKey(undefined, fallback)).toEqual(fallback);
  });
});

describe("buildMonthGrid", () => {
  it("pads to whole weeks with leading/trailing nulls", () => {
    // July 2026 starts on Wednesday (leading = 3) and has 31 days → 35 cells.
    const grid = buildMonthGrid(2026, 7);
    expect(grid).toHaveLength(35);
    expect(grid.slice(0, 3)).toEqual([null, null, null]);
    expect(grid[3]).toEqual({ day: 1, key: "2026-07-01" });
    expect(grid[33]).toEqual({ day: 31, key: "2026-07-31" });
    expect(grid[34]).toBeNull();
    expect(grid.length % 7).toBe(0);
  });
});
