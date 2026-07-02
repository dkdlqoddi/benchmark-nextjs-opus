# HabitLog

A habit tracker built with the **Next.js App Router**, **TypeScript**, **Tailwind
CSS**, and **Prisma + SQLite**. Create habits, check in each day, and watch your
streaks grow — with per-user accounts, a monthly calendar, weekly stats, tags,
search, and light/dark themes.

## Features

- **Accounts & privacy** — email + password sign-up and login (Auth.js /
  NextAuth v5, bcrypt-hashed passwords, JWT sessions). Every habit, check-in, and
  tag is scoped to its owner; one user can never read or reach another's data.
- **Habits** — create, edit, archive, restore, and permanently delete habits
  (all via Server Actions). Each habit has a name, optional description, a preset
  color, target weekdays, and tags.
- **Daily check-ins** — toggle today's check-in from a habit card, or any past
  day from the monthly calendar. One check-in per habit per day (enforced by a
  unique constraint); dates use a fixed **Asia/Seoul** day boundary.
- **Target days** — pick which weekdays a habit is "due" (e.g. _Mon/Wed/Fri_ or
  _Weekdays_). Streaks count only target days; you can still check in on off days.
- **Streaks & stats** — current streak, longest streak, and total check-ins per
  habit, plus a weekly completion-rate bar chart for the last 8 weeks
  (server-rendered SVG via visx — no client charting JS).
- **Tags, search & filter** — add comma-separated tags to habits, filter the home
  page by tag, and search habits by name, description, or tag.
- **Monthly calendar** — per-habit calendar with prev/next navigation; today is
  highlighted, future days are disabled, and off-days are dimmed.
- **Light / dark / system theme** — a theme toggle (next-themes, class-based) with
  no flash of the wrong theme on load.
- **Accessible & polished** — labeled forms, keyboard-operable controls,
  `aria-pressed` toggles, contrast-aware text on habit colors, loading skeletons,
  route + global error boundaries, a custom 404, and per-page SEO metadata.

## Tech stack

- **Next.js 16** (App Router) + **React 19**, **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Prisma 6** ORM with **SQLite** (`prisma/dev.db`)
- **Auth.js (NextAuth v5)** credentials auth + **bcryptjs**
- **visx** (SSR charts), **next-themes** (theming), **zod** (validation)
- **Vitest** (unit) + **Playwright** (E2E)
- **ESLint** + **Prettier**; package manager **npm**

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
# 1. Install dependencies (also generates the Prisma client via postinstall)
npm install

# 2. Create the SQLite database and apply migrations
npm run db:migrate

# 3. Seed two demo accounts, their habits, tags, and ~2 weeks of check-ins
npm run db:seed

# 4. Start the dev server → http://localhost:3000
npm run dev
```

Open http://localhost:3000 and **sign up** for a new account, or log in with one
of the seeded demo accounts:

| Email            | Password      |
| ---------------- | ------------- |
| `alice@test.com` | `password123` |
| `bob@test.com`   | `password123` |

> **Environment** — `.env` is committed for reproducibility and holds two keys:
> `DATABASE_URL` (`file:./dev.db`, resolved relative to `prisma/schema.prisma`, so
> the database lives at `prisma/dev.db`) and a **development-only** `AUTH_SECRET`
> used to sign session JWTs. Generate a fresh secret
> (`openssl rand -base64 33`) for any real deployment — never reuse the committed
> one.

## Testing

The project has two independent suites:

```bash
# Unit tests (Vitest) — pure lib/schema logic: dates, streaks, target-days,
# form/schema validation, and color contrast. Fast, no database or browser.
npm run test

# End-to-end tests (Playwright) — drives the real app in a headless browser.
# First time only, install the browser:
npx playwright install chromium
npm run test:e2e
```

- **Unit** tests live in `tests/unit/` (config: `vitest.config.mts`, Node env).
- **E2E** tests live in `tests/e2e/`. The runner builds the app, serves it on
  port 3100, and provisions a throwaway `prisma/test.db` (via `migrate deploy`),
  so your development `prisma/dev.db` is never touched. Coverage includes the
  sign-up → check-in → stats happy path and cross-user data isolation.

Other quality checks:

```bash
npm run build      # production build (also type-checks)
npx tsc --noEmit   # type-check only
npm run lint       # ESLint
npm run format     # Prettier (write)
```

## npm scripts

| Script                 | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Start the Next.js development server.                   |
| `npm run build`        | Create a production build.                              |
| `npm run start`        | Serve the production build (run `build` first).         |
| `npm run lint`         | Run ESLint.                                             |
| `npm run format`       | Format the codebase with Prettier.                      |
| `npm run format:check` | Check formatting without writing changes.               |
| `npm run test`         | Run the Vitest unit suite.                              |
| `npm run test:e2e`     | Run the Playwright end-to-end suite.                    |
| `npm run db:migrate`   | Apply Prisma migrations in development (`migrate dev`). |
| `npm run db:seed`      | Seed the database with demo accounts and data.          |
| `npm run db:reset`     | Drop, re-migrate, and re-seed the database.             |
| `npm run db:studio`    | Open Prisma Studio to browse the data.                  |

## Project structure

```
app/                     # App Router: routes, layout, error/loading/not-found
  api/auth/[...nextauth] # Auth.js (NextAuth) route handler
  login/  signup/        # auth pages
  habits/new/            # create a habit
  habits/[id]/           # habit detail (monthly calendar)
  habits/[id]/edit/      # edit a habit
  habits/archived/       # archived habits (restore / delete)
  stats/  settings/      # stats dashboard + settings
components/ui/            # generic UI (TopNav, ThemeToggle, ThemeProvider)
components/features/      # domain components (HabitCard, HabitForm, CalendarMonth,
                         #   AuthForm, WeeklyCompletionChart, DeleteHabitButton)
actions/                 # Server Actions — all mutations (habits, check-ins, auth)
lib/                     # utilities: prisma, auth, date, streak, target-days,
                         #   tags, colors, and zod schemas
prisma/                  # schema, migrations, and the seed script
tests/unit/              # Vitest unit tests
tests/e2e/               # Playwright end-to-end tests
types/                   # TypeScript module augmentations (next-auth session)
proxy.ts                 # route gate (Next 16's renamed middleware)
bench-reports/           # per-task work reports
```

### Architecture notes

- **Server Components by default.** Client Components (`"use client"`) are used
  only where interactivity requires them — forms, the theme toggle, and the
  delete-confirmation button.
- **Mutations go through Server Actions** in `actions/` — there are no data API
  routes (the only route handler is the Auth.js catch-all).
- **Defense-in-depth auth.** `proxy.ts` optimistically redirects logged-out users
  to `/login`, and every page and Server Action re-checks the session and
  resource ownership at the data layer (`lib/auth.ts`).

## Data model

Defined in [`prisma/schema.prisma`](./prisma/schema.prisma):

- **User** — `id`, `email` (unique), `name?`, `passwordHash`, `createdAt`. Owns
  many habits and tags.
- **Habit** — `id`, `userId` (FK, cascade delete), `name` (1–50 chars),
  `description?` (≤200 chars), `color` (hex string), `targetDays` (7-bit weekday
  mask, default `127` = every day), `createdAt`, `archivedAt?`. Has many check-ins
  and tags.
- **CheckIn** — `id`, `habitId` (FK, cascade delete), `date` (`YYYY-MM-DD`),
  `createdAt`. `habitId` + `date` is unique (one check-in per habit per day).
- **Tag** — `id`, `userId` (FK, cascade delete), `name`, `createdAt`. `userId` +
  `name` is unique (tags are per-user); many-to-many with `Habit`.

Because SQLite does not enforce string-length or format constraints, the
`name`/`description` length rules, hex-color format, and tag limits are validated
in the Server Actions layer with **zod** (`actions/habits.ts`, `lib/*-schema.ts`).

## Conventions

See [`CLAUDE.md`](./CLAUDE.md) for the full project and reporting rules that apply
to all work in this repository.
