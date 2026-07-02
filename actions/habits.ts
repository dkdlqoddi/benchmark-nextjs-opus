"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Creates a habit after enforcing the data-model constraints that SQLite
 * cannot: name 1-50 chars, description <= 200 chars, color as a #RRGGBB hex.
 */
export async function createHabit(input: {
  name: string;
  description?: string;
  color: string;
}) {
  const name = input.name.trim();
  const description = input.description?.trim();

  if (name.length < 1 || name.length > 50) {
    throw new Error("Habit name must be between 1 and 50 characters.");
  }
  if (description && description.length > 200) {
    throw new Error("Habit description must be 200 characters or fewer.");
  }
  if (!HEX_COLOR.test(input.color)) {
    throw new Error("Habit color must be a hex string such as #3b82f6.");
  }

  const habit = await prisma.habit.create({
    data: { name, description: description || null, color: input.color },
  });

  revalidatePath("/");
  return habit;
}
