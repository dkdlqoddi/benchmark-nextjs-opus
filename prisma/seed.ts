import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Returns a Date shifted back by `daysAgo` days from now (UTC). */
function daysAgoDate(daysAgo: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

/** Formats a Date as a YYYY-MM-DD string to match CheckIn.date. */
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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

/** Seeds three habits, each with random check-ins across the last 14 days. */
async function main() {
  // Make the seed idempotent.
  await prisma.checkIn.deleteMany();
  await prisma.habit.deleteMany();

  for (const data of SEED_HABITS) {
    const habit = await prisma.habit.create({ data });

    for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
      // ~55% chance of a check-in on each of the last 14 days.
      if (Math.random() < 0.55) {
        await prisma.checkIn.create({
          data: { habitId: habit.id, date: toDateKey(daysAgoDate(daysAgo)) },
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
