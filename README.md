# HabitLog

A simple habit tracker built with the Next.js App Router, TypeScript, Tailwind
CSS, and Prisma + SQLite.

## Tech stack

- **Next.js** (App Router) + **React**, **TypeScript** (strict mode)
- **Tailwind CSS** (v4)
- **Prisma ORM** with **SQLite** (`prisma/dev.db`)
- **ESLint** + **Prettier**
- Package manager: **npm**

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
# 1. Install dependencies (also generates the Prisma client via postinstall)
npm install

# 2. Create the SQLite database and apply migrations
npm run db:migrate

# 3. Seed 3 sample habits with random check-ins over the last 2 weeks
npm run db:seed

# 4. Start the dev server (http://localhost:3000)
npm run dev
```

> The database connection string lives in `.env` as
> `DATABASE_URL="file:./dev.db"`. Prisma resolves this relative to
> `prisma/schema.prisma`, so the database file is created at `prisma/dev.db`.
> The `.env` file contains no secrets and is committed for reproducibility.

## npm scripts

| Script                 | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Start the Next.js development server.                   |
| `npm run build`        | Create a production build.                              |
| `npm run start`        | Serve the production build (run `build` first).         |
| `npm run lint`         | Run ESLint.                                             |
| `npm run format`       | Format the codebase with Prettier.                      |
| `npm run format:check` | Check formatting without writing changes.               |
| `npm run db:migrate`   | Apply Prisma migrations in development (`migrate dev`). |
| `npm run db:seed`      | Seed the database with sample data.                     |
| `npm run db:reset`     | Drop, re-migrate, and re-seed the database.             |
| `npm run db:studio`    | Open Prisma Studio to browse the data.                  |

## Project structure

```
app/                  # App Router routes (Home / Stats / Settings) + layout
components/ui/         # Generic, reusable UI components (e.g. TopNav)
components/features/   # Domain components (e.g. HabitCard)
lib/                   # Utilities and the shared Prisma client
actions/               # Server Actions (all data mutations live here)
prisma/                # Prisma schema, migrations, and seed script
bench-reports/         # Per-task work reports
```

## Data model

- **Habit** — `id`, `name` (1–50 chars), `description` (optional, ≤200 chars),
  `color` (hex string), `createdAt`, `archivedAt` (nullable).
- **CheckIn** — `id`, `habitId` (FK), `date` (`YYYY-MM-DD` string), `createdAt`.
  The combination of `habitId` + `date` is unique (one check-in per habit
  per day).

Because SQLite does not enforce string length limits, the `name`/`description`
length rules and the hex-color format are validated in the Server Actions layer
(`actions/habits.ts`).

## Conventions

See [`CLAUDE.md`](./CLAUDE.md) for the full project and reporting rules that
apply to all work in this repository.
