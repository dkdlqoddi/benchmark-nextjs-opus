"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, assertHabitOwner } from "@/lib/auth";
import { habitSchema, type HabitFormState } from "@/lib/habit-schema";
import { parseTags, validateTags } from "@/lib/tags";

/** Reads and trims the habit form fields from FormData. */
function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    color: String(formData.get("color") ?? "").trim(),
    targetDays: Number(formData.get("targetDays") ?? ""),
    tags: String(formData.get("tags") ?? "").trim(),
  };
}

/** Upserts the given tag names for a user and returns their ids. */
async function resolveTagIds(
  userId: string,
  names: string[],
): Promise<string[]> {
  const tags = await Promise.all(
    names.map((name) =>
      prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name },
        update: {},
        select: { id: true },
      }),
    ),
  );
  return tags.map((tag) => tag.id);
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

/** Creates a habit from validated form data; redirects to home on success. */
export async function createHabit(
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const userId = await requireUserId();
  const values = readForm(formData);
  const parsed = habitSchema.safeParse(values);
  const tagNames = parseTags(values.tags);
  const tagError = validateTags(tagNames);
  if (!parsed.success || tagError) {
    const errors: NonNullable<HabitFormState["errors"]> = parsed.success
      ? {}
      : toFieldErrors(parsed.error);
    if (tagError) errors.tags = tagError;
    return { errors, values };
  }

  const tagIds = await resolveTagIds(userId, tagNames);
  await prisma.habit.create({
    data: {
      userId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
      targetDays: parsed.data.targetDays,
      tags: { connect: tagIds.map((id) => ({ id })) },
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
  const userId = await requireUserId();
  const values = readForm(formData);
  const parsed = habitSchema.safeParse(values);
  const tagNames = parseTags(values.tags);
  const tagError = validateTags(tagNames);
  if (!parsed.success || tagError) {
    const errors: NonNullable<HabitFormState["errors"]> = parsed.success
      ? {}
      : toFieldErrors(parsed.error);
    if (tagError) errors.tags = tagError;
    return { errors, values };
  }

  await assertHabitOwner(id, userId);
  const tagIds = await resolveTagIds(userId, tagNames);
  await prisma.habit.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
      targetDays: parsed.data.targetDays,
      // `set` replaces the habit's tags with exactly the submitted list.
      tags: { set: tagIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/");
  redirect("/");
}

/** Archives a habit (sets archivedAt) so it is hidden from the home list. */
export async function archiveHabit(id: string) {
  const userId = await requireUserId();
  await assertHabitOwner(id, userId);
  await prisma.habit.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/habits/archived");
}

/** Restores an archived habit by clearing archivedAt. */
export async function restoreHabit(id: string) {
  const userId = await requireUserId();
  await assertHabitOwner(id, userId);
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
  const userId = await requireUserId();
  await assertHabitOwner(id, userId);
  await prisma.$transaction([
    prisma.checkIn.deleteMany({ where: { habitId: id } }),
    prisma.habit.delete({ where: { id } }),
  ]);
  revalidatePath("/");
  revalidatePath("/habits/archived");
}
