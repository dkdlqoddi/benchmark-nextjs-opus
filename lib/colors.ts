/**
 * The 8 preset colors a habit may use, as #RRGGBB hex strings. A habit's color
 * is dynamic data (not a design token), so these are stored/applied as raw hex.
 */
export const HABIT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number];
