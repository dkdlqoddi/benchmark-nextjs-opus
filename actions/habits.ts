"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { habitSchema, type HabitFormState } from "@/lib/habit-schema";

/** Reads and trims the habit form fields from FormData. */
function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    color: String(formData.get("color") ?? "").trim(),
  };
}

/** Maps a ZodError to a per-field error record for the form. */
function toFieldErrors(error: ZodError): NonNullable<HabitFormState["errors"]> {
  const errors: NonNullable<HabitFormState["errors"]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "name" || key === "description" || key === "color") {
      if (!errors[key]) errors[key] = issue.message;
    }
  }
  return errors;
}

/** Creates a habit from validated form data; redirects to home on success. */
export async function createHabit(
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const values = readForm(formData);
  const parsed = habitSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: toFieldErrors(parsed.error), values };
  }

  await prisma.habit.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
    },
  });

  revalidatePath("/");
  redirect("/");
}

/** Updates an existing habit (id bound first); redirects to home on success. */
export async function updateHabit(
  id: string,
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const values = readForm(formData);
  const parsed = habitSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: toFieldErrors(parsed.error), values };
  }

  await prisma.habit.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
    },
  });

  revalidatePath("/");
  redirect("/");
}

/** Archives a habit (sets archivedAt) so it is hidden from the home list. */
export async function archiveHabit(id: string) {
  await prisma.habit.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/habits/archived");
}

/** Restores an archived habit by clearing archivedAt. */
export async function restoreHabit(id: string) {
  await prisma.habit.update({
    where: { id },
    data: { archivedAt: null },
  });
  revalidatePath("/");
  revalidatePath("/habits/archived");
}

/**
 * Permanently deletes a habit and all of its check-ins (archived list only).
 * Uses a transaction so the check-ins are always removed with the habit.
 */
export async function deleteHabit(id: string) {
  await prisma.$transaction([
    prisma.checkIn.deleteMany({ where: { habitId: id } }),
    prisma.habit.delete({ where: { id } }),
  ]);
  revalidatePath("/");
  revalidatePath("/habits/archived");
}
