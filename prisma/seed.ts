import { PrismaClient } from "@prisma/client";
import { getTodayKey, shiftKey } from "../lib/date";

const prisma = new PrismaClient();

const SEED_HABITS = [
  {
    name: "Drink Water",
    description: "Aim for 8 glasses a day.",
    color: "#3b82f6",
  },
  {
    name: "Read 20 Minutes",
    description: "Fiction or non-fiction.",
    color: "#22c55e",
  },
  {
    name: "Morning Run",
    description: "At least 2 km before breakfast.",
    color: "#f97316",
  },
];

/** Seeds three habits, each with random check-ins across the last 14 days (Asia/Seoul). */
async function main() {
  // Make the seed idempotent.
  await prisma.checkIn.deleteMany();
  await prisma.habit.deleteMany();

  const today = getTodayKey();
  for (const data of SEED_HABITS) {
    const habit = await prisma.habit.create({ data });

    for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
      // ~55% chance of a check-in on each of the last 14 days.
      if (Math.random() < 0.55) {
        await prisma.checkIn.create({
          data: { habitId: habit.id, date: shiftKey(today, -daysAgo) },
        });
      }
    }
  }

  const habits = await prisma.habit.count();
  const checkIns = await prisma.checkIn.count();
  console.log(`Seeded ${habits} habits and ${checkIns} check-ins.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
