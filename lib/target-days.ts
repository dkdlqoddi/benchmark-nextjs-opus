import { WEEKDAY_LABELS } from "./date";

/**
 * A habit's target days are stored as a 7-bit mask: bit i is set when weekday i
 * (0 = Sunday .. 6 = Saturday, matching lib/date's weekday indices) is a target
 * day. "Every day" is all seven bits set (127); habits default to this.
 */
export const EVERY_DAY = 0b1111111; // 127

/** True when `weekday` (0 = Sunday .. 6 = Saturday) is a target day in `mask`. */
export function isTargetWeekday(mask: number, weekday: number): boolean {
  return (mask & (1 << weekday)) !== 0;
}

/** The target weekday indices (0 = Sun .. 6 = Sat) contained in `mask`, ascending. */
export function maskToWeekdays(mask: number): number[] {
  const weekdays: number[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    if (isTargetWeekday(mask, weekday)) weekdays.push(weekday);
  }
  return weekdays;
}

/** Builds a mask from a list of weekday indices (0 = Sun .. 6 = Sat). */
export function weekdaysToMask(weekdays: number[]): number {
  return weekdays.reduce((mask, weekday) => mask | (1 << weekday), 0);
}

/** Returns `mask` with `weekday` (0 = Sun .. 6 = Sat) toggled on or off. */
export function toggleWeekday(mask: number, weekday: number): number {
  return mask ^ (1 << weekday);
}

/** True when the mask selects at least one, and at most all seven, weekdays. */
export function isValidMask(mask: number): boolean {
  return Number.isInteger(mask) && mask >= 1 && mask <= EVERY_DAY;
}

/** A short human label for a target-days mask, e.g. "Every day" or "Mon, Wed, Fri". */
export function describeMask(mask: number): string {
  if ((mask & EVERY_DAY) === EVERY_DAY) return "Every day";
  const weekdays = maskToWeekdays(mask);
  if (weekdays.length === 0) return "No days";
  if (weekdays.length === 5 && weekdays.every((d) => d >= 1 && d <= 5)) {
    return "Weekdays";
  }
  if (weekdays.length === 2 && weekdays.includes(0) && weekdays.includes(6)) {
    return "Weekends";
  }
  return weekdays.map((d) => WEEKDAY_LABELS[d]).join(", ");
}
