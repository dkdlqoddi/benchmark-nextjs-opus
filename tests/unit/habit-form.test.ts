import { describe, expect, it } from "vitest";
import { parseHabitForm } from "@/lib/habit-schema";
import { HABIT_COLORS } from "@/lib/colors";
import { EVERY_DAY } from "@/lib/target-days";

/** Builds a FormData from a plain field map (all values are strings, as in a POST). */
function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const validFields = {
  name: "Read",
  description: "Daily reading",
  color: HABIT_COLORS[0],
  targetDays: "62",
  tags: "Health, health,  Morning ",
};

// parseHabitForm is the shared create/update validation extracted from
// actions/habits.ts; these lock its behaviour so the refactor stays equivalent.
describe("parseHabitForm", () => {
  it("returns validated data and cleaned tag names for valid input", () => {
    const result = parseHabitForm(form(validFields));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.data).toEqual({
        name: "Read",
        description: "Daily reading",
        color: HABIT_COLORS[0],
        targetDays: 62,
      });
      // Trimmed, whitespace-collapsed, case-insensitively de-duplicated.
      expect(result.parsed.tagNames).toEqual(["Health", "Morning"]);
    }
  });

  it("accepts empty description and empty tags", () => {
    const result = parseHabitForm(
      form({ ...validFields, description: "", tags: "" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.data.description).toBe("");
      expect(result.parsed.tagNames).toEqual([]);
    }
  });

  it("reports a name error and echoes back the submitted values", () => {
    const result = parseHabitForm(form({ ...validFields, name: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.state.errors?.name).toBeDefined();
      expect(result.state.values?.name).toBe("");
      // Submitted values are preserved for re-render (raw tag string is trimmed).
      expect(result.state.values?.tags).toBe(validFields.tags.trim());
    }
  });

  it("reports a color error for a non-preset color", () => {
    const result = parseHabitForm(form({ ...validFields, color: "#000000" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.state.errors?.color).toBeDefined();
  });

  it("reports a targetDays error when out of range", () => {
    const result = parseHabitForm(form({ ...validFields, targetDays: "0" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.state.errors?.targetDays).toBeDefined();
    const tooHigh = parseHabitForm(
      form({ ...validFields, targetDays: String(EVERY_DAY + 1) }),
    );
    expect(tooHigh.ok).toBe(false);
  });

  it("reports a tags error when there are too many tags", () => {
    const result = parseHabitForm(
      form({ ...validFields, tags: "a,b,c,d,e,f,g,h,i,j,k" }), // 11 tags
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.state.errors?.tags).toBeDefined();
      // Schema fields were valid, so only the tags error is present.
      expect(result.state.errors?.name).toBeUndefined();
    }
  });

  it("reports field and tag errors together", () => {
    const result = parseHabitForm(
      form({ ...validFields, name: "", tags: "a,b,c,d,e,f,g,h,i,j,k" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.state.errors?.name).toBeDefined();
      expect(result.state.errors?.tags).toBeDefined();
    }
  });
});
