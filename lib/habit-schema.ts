import { z } from "zod";
import { HABIT_COLORS } from "@/lib/colors";

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
});

export type HabitFormValues = {
  name: string;
  description: string;
  color: string;
};

/** Result returned by the create/edit form actions (errors + submitted values). */
export type HabitFormState = {
  errors?: Partial<Record<keyof HabitFormValues, string>>;
  values?: HabitFormValues;
};
