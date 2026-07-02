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

/** WCAG relative luminance (0–1) of a `#RRGGBB` hex color. */
function relativeLuminance(hex: string): number {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/**
 * Picks the Tailwind text-color token — `text-black` or `text-white` — that has
 * the higher WCAG contrast against the given `#RRGGBB` background. Used for label
 * text drawn on a habit's own dynamic color (the checked-in button and calendar
 * day): white text over the lighter presets (yellow, green, teal, …) fails
 * contrast requirements, so the token is chosen per-color instead of hardcoded.
 */
export function readableOnColorClass(hex: string): "text-black" | "text-white" {
  const luminance = relativeLuminance(hex);
  // Contrast vs black text = (L + 0.05) / 0.05; vs white = 1.05 / (L + 0.05).
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);
  return blackContrast >= whiteContrast ? "text-black" : "text-white";
}
