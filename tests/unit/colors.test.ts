import { describe, expect, it } from "vitest";
import { HABIT_COLORS, readableOnColorClass } from "@/lib/colors";

// Independent WCAG contrast oracle (re-derived here so the test doesn't reuse the
// implementation's own luminance math). See https://www.w3.org/TR/WCAG21/#contrast-minimum.
function luminance(hex: string): number {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrastRatio(bgHex: string, textToken: "text-black" | "text-white") {
  const bg = luminance(bgHex);
  const text = textToken === "text-white" ? 1 : 0; // #fff = 1, #000 = 0
  const [lighter, darker] = bg > text ? [bg, text] : [text, bg];
  return (lighter + 0.05) / (darker + 0.05);
}

describe("readableOnColorClass", () => {
  it.each(HABIT_COLORS)(
    "picks a text color that meets WCAG AA (4.5:1) on %s",
    (hex) => {
      const token = readableOnColorClass(hex);
      expect(contrastRatio(hex, token)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("returns white for a very dark background and black for a light one", () => {
    expect(readableOnColorClass("#000000")).toBe("text-white");
    expect(readableOnColorClass("#ffffff")).toBe("text-black");
  });
});
