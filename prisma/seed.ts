import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { getTodayKey, shiftKey } from "../lib/date";
import { EVERY_DAY, weekdaysToMask } from "../lib/target-days";

const prisma = new PrismaClient();

const PASSWORD = "password123";

// Weekday indices: 0=Sun .. 6=Sat.
const WEEKDAYS = weekdaysToMask([1, 2, 3, 4, 5]); // Mon–Fri
const MON_WED_FRI = weekdaysToMask([1, 3, 5]);

const ACCOUNTS = [
  {
    email: "alice@test.com",
    name: "Alice",
    habits: [
      { name: "Drink Water", description: "Aim for 8 glasses a day.", color: "#3b82f6", targetDays: EVERY_DAY },
      { name: "Read 20 Minutes", description: "Fiction or non-fiction.", color: "#22c55e", targetDays: WEEKDAYS },
    ],
  },
  {
    email: "bob@test.com",
    name: "Bob",
    habits: [
      { name: "Morning Run", description: "At least 2 km before breakfast.", color: "#f97316", targetDays: MON_WED_FRI },
      { name: "Meditate", description: "Ten minutes of calm.", color: "#8b5cf6", targetDays: EVERY_DAY },
    ],
  },
];

/** Seeds two test users, each with their own habits and ~2 weeks of check-ins. */
async function main() {
  // Idempotent: clear check-ins and habits, then users (order avoids FK issues).
  await prisma.checkIn.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.user.deleteMany();

  const today = getTodayKey();
  const passwordHash = await hash(PASSWORD, 10);

  for (const account of ACCOUNTS) {
    const user = await prisma.user.create({
      data: {
        email: account.email,
        name: account.name,
        passwordHash,
      },
    });

    for (const habitData of account.habits) {
      const habit = await prisma.habit.create({
        data: { ...habitData, userId: user.id },
      });

      for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
        // ~55% chance of a check-in on each of the last 14 days.
        if (Math.random() < 0.55) {
          await prisma.checkIn.create({
            data: { habitId: habit.id, date: shiftKey(today, -daysAgo) },
          });
        }
      }
    }
  }

  const users = await prisma.user.count();
  const habits = await prisma.habit.count();
  const checkIns = await prisma.checkIn.count();
  console.log(`Seeded ${users} users, ${habits} habits, and ${checkIns} check-ins.`);
  console.log(`Test accounts: alice@test.com, bob@test.com — password: ${PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
