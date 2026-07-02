import { z, type ZodError } from "zod";
import { HABIT_COLORS } from "@/lib/colors";
import { EVERY_DAY } from "@/lib/target-days";
import { parseTags, validateTags } from "@/lib/tags";

/** Server-side validation schema for habit create/edit form input. */
export const habitSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(50, "Name must be 50 characters or fewer."),
  description: z
    .string()
    .max(200, "Description must be 200 characters or fewer."),
  color: z
    .string()
    .refine(
      (value) => (HABIT_COLORS as readonly string[]).includes(value),
      "Choose one of the preset colors.",
    ),
  targetDays: z
    .number()
    .int()
    .refine(
      (value) => value >= 1 && value <= EVERY_DAY,
      "Select at least one target day.",
    ),
});

export type HabitFormValues = {
  name: string;
  description: string;
  color: string;
  targetDays: number;
  // Raw comma-separated tag input; parsed/validated by parseHabitForm below.
  tags: string;
};

/** Result returned by the create/edit form actions (errors + submitted values). */
export type HabitFormState = {
  errors?: Partial<Record<keyof HabitFormValues, string>>;
  values?: HabitFormValues;
};

/** Reads and trims the habit form fields from FormData. */
function readForm(formData: FormData): HabitFormValues {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    color: String(formData.get("color") ?? "").trim(),
    targetDays: Number(formData.get("targetDays") ?? ""),
    tags: String(formData.get("tags") ?? "").trim(),
  };
}

/** Maps a ZodError to a per-field error record for the form. */
function toFieldErrors(error: ZodError): NonNullable<HabitFormState["errors"]> {
  const errors: NonNullable<HabitFormState["errors"]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (
      key === "name" ||
      key === "description" ||
      key === "color" ||
      key === "targetDays"
    ) {
      if (!errors[key]) errors[key] = issue.message;
    }
  }
  return errors;
}

/** Validated habit fields (schema output) plus the cleaned tag-name list. */
export type ParsedHabit = {
  data: z.infer<typeof habitSchema>;
  tagNames: string[];
};

/**
 * Validates raw habit form input in one place for both create and update:
 * parses the schema fields and the comma-separated tags. On success returns the
 * validated data and cleaned tag names; on failure returns a HabitFormState with
 * per-field errors (including a `tags` error) and the submitted values so the
 * form can re-render.
 */
export function parseHabitForm(
  formData: FormData,
): { ok: true; parsed: ParsedHabit } | { ok: false; state: HabitFormState } {
  const values = readForm(formData);
  const parsed = habitSchema.safeParse(values);
  const tagNames = parseTags(values.tags);
  const tagError = validateTags(tagNames);
  if (!parsed.success || tagError) {
    const errors: NonNullable<HabitFormState["errors"]> = parsed.success
      ? {}
      : toFieldErrors(parsed.error);
    if (tagError) errors.tags = tagError;
    return { ok: false, state: { errors, values } };
  }
  return { ok: true, parsed: { data: parsed.data, tagNames } };
}
