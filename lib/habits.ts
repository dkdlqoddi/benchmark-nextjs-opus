import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Loads a habit by id, scoped to its owner (returns `null` when it doesn't exist
 * or belongs to someone else). Wrapped in React's `cache` so a page and its
 * `generateMetadata` — which both need the same habit — share a single query per
 * request instead of hitting the database twice.
 */
export const getOwnedHabit = cache((id: string, userId: string) => {
  return prisma.habit.findFirst({
    where: { id, userId },
    include: {
      tags: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });
});
