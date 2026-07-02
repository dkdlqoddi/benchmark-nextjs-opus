# HabitLog — Project Guide

HabitLog is a habit tracker web app. Stack: **Next.js (App Router) + TypeScript
(strict)**, **Tailwind CSS**, **Prisma ORM + SQLite** (`prisma/dev.db`),
**ESLint + Prettier**, package manager **npm**.

---

## Project Rules (apply to all work)

1. **Server Components by default.** Write every component as a Server
   Component. Use `'use client'` only when client interactivity is required,
   and add a one-line comment at the top of the file explaining why.
2. **Mutations via Server Actions.** All data mutations must go through Server
   Actions in `actions/` — no API Routes.
3. **Naming.** PascalCase for component files (e.g. `HabitCard.tsx`);
   kebab-case for everything else.
4. **Directory structure:**
   - `app/` — routes
   - `components/ui/` — generic UI
   - `components/features/` — domain components
   - `lib/` — utilities, Prisma client
   - `actions/` — server actions
5. **No hardcoded colors** — use Tailwind tokens only. (Exception: a habit's
   own `color` value is dynamic data and may be applied via inline style.)
6. **JSDoc.** Every exported function must have at least one line of JSDoc.

## Data Model (Prisma)

- **Habit:** `id`, `name` (1–50 chars), `description` (optional, ≤200 chars),
  `color` (hex string), `createdAt`, `archivedAt` (nullable).
- **CheckIn:** `id`, `habitId` (FK), `date` (`YYYY-MM-DD` string), `createdAt`.
- **Constraint:** the combination of `habitId` + `date` must be unique.

SQLite cannot enforce string-length limits, so the length/format constraints
are validated in the Server Actions layer (`actions/habits.ts`).

---

## Reporting Rules (apply to every task)

- Keep a `bench-reports/` directory at the repository root.
- **Timing:** the very first command of every task must be
  `date -u +"%Y-%m-%dT%H:%M:%SZ"` — record it as **Start**. Run it again as the
  last step before writing the report — record it as **End**. Include
  Start / End / Elapsed in the report.
- On completing each task, write a single file `bench-reports/pNN.md` (with `NN`
  as specified per task) containing these 6 sections:
  1. Work summary
  2. Files created/modified
  3. Verification commands run and their raw output
  4. Key decisions and reasons
  5. Remaining issues/TODOs
  6. Timing (Start / End / Elapsed)
- End every report with the exact line `TOKENS: TBD`. Never guess or estimate
  token usage — the operator replaces `TBD` with the measured value.
- **Git:** do not commit while working. After the report is written, stage all
  changes and create exactly one commit whose message starts with `pNN: `
  followed by a short summary, then push to origin main. Every task ends with
  this single commit and push.
- Always persist results to the report file, not only to chat.

---

## Verification checklist (per task)

- `npm run build` — 0 errors
- `npx tsc --noEmit` — 0 errors
- `npm run lint` — 0 errors

---

<!-- Next.js version-specific guidance for coding agents. -->

@AGENTS.md
