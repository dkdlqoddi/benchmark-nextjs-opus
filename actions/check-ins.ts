"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId, assertHabitOwner } from "@/lib/auth";
import { getTodayKey, isValidDateKey } from "@/lib/date";

/**
 * Toggles a habit's check-in for a specific date (past or today only). Creates
 * the check-in if absent, removes it if present. Future/invalid dates are
 * rejected, and the habit must belong to the current user.
 */
export async function toggleCheckIn(habitId: string, dateKey: string) {
  const userId = await requireUserId();
  if (!isValidDateKey(dateKey)) {
    throw new Error("Invalid date.");
  }
  if (dateKey > getTodayKey()) {
    throw new Error("Cannot check in for a future date.");
  }
  await assertHabitOwner(habitId, userId);

  const deleted = await prisma.checkIn.deleteMany({
    where: { habitId, date: dateKey },
  });
  if (deleted.count === 0) {
    try {
      await prisma.checkIn.create({ data: { habitId, date: dateKey } });
    } catch (error) {
      // A concurrent toggle (e.g. a double-click) can insert the same
      // [habitId, date] between our deleteMany and create, tripping the unique
      // constraint (P2002). The intended end state — checked in — already
      // holds, so treat that specific collision as success, not a 500.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
    }
  }

  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
}

/** Toggles today's check-in for a habit (Asia/Seoul). */
export async function toggleToday(habitId: string) {
  await toggleCheckIn(habitId, getTodayKey());
}
