"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTodayKey } from "@/lib/date";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Toggles a habit's check-in for a specific date (past or today only). Creates
 * the check-in if absent, removes it if present. Future dates are rejected.
 */
export async function toggleCheckIn(habitId: string, dateKey: string) {
  if (!DATE_KEY.test(dateKey)) {
    throw new Error("Invalid date.");
  }
  if (dateKey > getTodayKey()) {
    throw new Error("Cannot check in for a future date.");
  }

  const deleted = await prisma.checkIn.deleteMany({
    where: { habitId, date: dateKey },
  });
  if (deleted.count === 0) {
    await prisma.checkIn.create({ data: { habitId, date: dateKey } });
  }

  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
}

/** Toggles today's check-in for a habit (Asia/Seoul). */
export async function toggleToday(habitId: string) {
  await toggleCheckIn(habitId, getTodayKey());
}
