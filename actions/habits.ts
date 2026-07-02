"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId, assertHabitOwner, requireHabitOwner } from "@/lib/auth";
import { parseHabitForm, type HabitFormState } from "@/lib/habit-schema";

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

/** Creates a habit from validated form data; redirects to home on success. */
export async function createHabit(
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const userId = await requireUserId();
  const result = parseHabitForm(formData);
  if (!result.ok) return result.state;
  const { data, tagNames } = result.parsed;

  const tagIds = await resolveTagIds(userId, tagNames);
  await prisma.habit.create({
    data: {
      userId,
      name: data.name,
      description: data.description || null,
      color: data.color,
      targetDays: data.targetDays,
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
  // Auth first, then validate, then ownership — preserves the original order so
  // an invalid form returns field errors even for a habit the user doesn't own.
  const userId = await requireUserId();
  const result = parseHabitForm(formData);
  if (!result.ok) return result.state;
  const { data, tagNames } = result.parsed;

  await assertHabitOwner(id, userId);
  const tagIds = await resolveTagIds(userId, tagNames);
  await prisma.habit.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      targetDays: data.targetDays,
      // `set` replaces the habit's tags with exactly the submitted list.
      tags: { set: tagIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/");
  redirect("/");
}

/** Archives a habit (sets archivedAt) so it is hidden from the home list. */
export async function archiveHabit(id: string) {
  await requireHabitOwner(id);
  await prisma.habit.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/habits/archived");
}

/** Restores an archived habit by clearing archivedAt. */
export async function restoreHabit(id: string) {
  await requireHabitOwner(id);
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
  await requireHabitOwner(id);
  await prisma.$transaction([
    prisma.checkIn.deleteMany({ where: { habitId: id } }),
    prisma.habit.delete({ where: { id } }),
  ]);
  revalidatePath("/");
  revalidatePath("/habits/archived");
}
