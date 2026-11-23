# Finance Tracker

[![CI](https://github.com/Ibz909/Finance-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Ibz909/Finance-Tracker/actions/workflows/ci.yml)

A personal finance tracker for recording income and spending in GBP and seeing your monthly cash flow at a glance. Built with React, TypeScript and Tailwind CSS. **Everything stays in your browser:** there is no server, no account and no tracking.

> **Status:** Phase 1 (the working foundation) is complete. Budgets, charts, recurring transactions, savings goals and CSV import/export are planned; see the [roadmap](#roadmap).

## Features

- **Transactions:** add, edit and delete income and expenses, with a description, category, date and optional notes. Every field is validated, with clear messages linked to the field that needs fixing.
- **Monthly dashboard:** income, expenses, net cash flow and savings rate for any month, plus that month's recent transactions. The figures update the moment your data changes.
- **Reporting month picker:** step backwards and forwards through months, or jump back to the current one.
- **18 categories** (12 expense, 6 income), each with its own icon and colour.
- **Light, dark and system themes:** your choice is remembered, and the page never flashes the wrong theme on load.
- **Demo data:** one click loads six months of realistic, clearly labelled fictional transactions. Clearing it removes only demo records, never your own.
- **Safe local storage:** data survives refreshes. If stored data is ever damaged, the app keeps what it can, backs up the original before changing anything, and tells you what happened.
- **Responsive and accessible:**
  - a mobile navigation drawer and phone-friendly layouts
  - full keyboard support with visible focus
  - accessible dialogs and labelled form errors
  - status shown in words, not just colour
  - respect for "reduce motion"

## Tech stack

| Area       | Choice                         | Why                                                                                                      |
| ---------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| UI         | React 19 + TypeScript (strict) | Function components and hooks; strict types catch mistakes before they run.                              |
| Build      | Vite 8                         | Fast dev server and builds; Vitest shares its configuration.                                             |
| Styling    | Tailwind CSS v4                | CSS-first `@theme` tokens; light and dark themes swap one set of CSS variables.                          |
| Routing    | React Router 8                 | One layout route; each page renders inside it.                                                           |
| Forms      | React Hook Form                | Minimal re-renders, and focuses the first invalid field.                                                 |
| Validation | Zod 4                          | One schema validates forms, stored data and (later) CSV imports. TypeScript types are generated from it. |
| Dates      | date-fns                       | Local-time calendar maths without timezone surprises.                                                    |
| Icons      | Lucide React                   | Consistent, tree-shakeable icons.                                                                        |
| Tests      | Vitest + React Testing Library | Tests use the app the way people do: by role, label and text.                                            |
| Quality    | ESLint (type-aware) + Prettier | Enforced locally and in CI.                                                                              |

## Getting started

**You'll need** [Node.js](https://nodejs.org/) 20 or later (the repo's `.nvmrc` pins 22) and npm.

```bash
git clone https://github.com/Ibz909/Finance-Tracker.git
cd Finance-Tracker
npm ci
npm run dev
```

Open http://localhost:5173. To explore without typing anything, click **Explore with demo data** on the dashboard.

## Scripts

| Command                           | What it does                                                             |
| --------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                     | Starts the development server with hot reload.                           |
| `npm run build`                   | Type-checks, then builds an optimised production bundle into `dist/`.    |
| `npm run preview`                 | Serves the production build locally.                                     |
| `npm run typecheck`               | Runs the TypeScript compiler without emitting files.                     |
| `npm run lint` / `lint:fix`       | Lints with ESLint (and fixes what it can).                               |
| `npm run format` / `format:check` | Formats with Prettier, or checks formatting.                             |
| `npm test` / `test:watch`         | Runs the test suite once, or in watch mode.                              |
| `npm run check`                   | Runs everything CI runs: typecheck, lint, format check, tests and build. |

GitHub Actions runs the same checks on every pull request to `main` and on every push to `main`.

## Project structure

```text
src/
├── app/            App root, routes and route-level pages (404, error)
├── components/
│   ├── layout/     App shell: sidebar, top bar, mobile drawer, banners
│   └── ui/         Reusable pieces: Button, Dialog, FormField, StatCard…
├── constants/      Categories, money limits, navigation, storage keys
├── context/        Providers: app data (with reducer), theme, toasts, dialogs, month
├── features/       One folder per feature, holding its components and pure logic
│   ├── dashboard/  Monthly summary calculations and dashboard UI
│   ├── demo/       Deterministic demo-data generator
│   ├── settings/   Appearance and demo data settings
│   ├── transactions/ Form, list, schemas and sorting
│   └── …           Budgets, analytics and savings pages (coming soon)
├── hooks/          Custom hooks that read the contexts above
├── models/         Zod schemas and the TypeScript types inferred from them
├── services/
│   └── storage/    Versioned localStorage repository, migrations, decoding
├── styles/         Tailwind entry point and design tokens
├── test/           Test setup, fixtures and render helpers
└── utils/          Money, date and formatting helpers
```

Tests sit next to the code they cover, e.g. `summary.ts` and `summary.test.ts`.

## How it works

### Data flow

```text
Component ──► action hook (validates with Zod) ──► dispatch ──► pure reducer
    ▲                                                             │
    │  derived figures (useMemo)                                   ▼
AppData context ◄───────────────── new state ──────────────► DataRepository.save()
                                                               (localStorage today)
```

- **One source of truth.** All financial data lives in a single `AppDataProvider`. State and `dispatch` are in separate contexts, so components that only trigger actions don't re-render when data changes.
- **Totals are never stored.** Income, expenses, net cash flow and savings rate are calculated from transactions with pure, tested functions, so they can't drift out of sync.
- **Saving happens on dispatch.** Each change runs through the reducer and is saved once, immediately. A failed save shows a message instead of failing silently.
- **Storage is swappable.** Components never touch `localStorage`; they go through a `DataRepository` interface. Moving to Supabase or a REST API means writing a new implementation (async, since a network is involved) without changing the UI.

### Money

Amounts are stored as **integer pence** (£12.50 → `1250`). In floating point, `0.1 + 0.2` is `0.30000000000000004`; integer pence are always exact.

Typed amounts like `£1,234.56` are parsed from the string's digits, never with `parseFloat(x) * 100`. Values are formatted with `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })` only for display. The maximum single amount is £10,000,000.

### Dates

Calendar dates are stored as `YYYY-MM-DD` strings and months as `YYYY-MM`, always parsed in **local** time.

`new Date('2026-03-01')` is read as UTC midnight, which is still 28 February in the Americas, so the app never uses it. "Today" and "this month" also come from the local calendar, not UTC. Because the strings are zero-padded, plain string comparison sorts them correctly.

### Validation

Zod schemas in `src/models` are the single source of truth for what valid data looks like:

- **Forms** use them for inline errors.
- **Action hooks** check input again before anything reaches state.
- **Stored data** is validated record by record on load.

The form adds only one step of its own: parsing the amount text into pence.

### Storage format and recovery

Data is saved under `finance-tracker:data` as `{ schemaVersion, data }`. When the shape changes, a migration upgrades older data step by step. Later features will add their collections this way.

On load:

- **Invalid records** are skipped one by one rather than discarding everything.
- **Duplicate IDs** are dropped.
- **Unreadable data** is copied to a `finance-tracker:data-backup:<timestamp>` key **before** anything is rewritten. If the backup can't be written, the original is left untouched.
- **Data from a newer app version** is preserved rather than overwritten.

The theme preference has its own key (`finance-tracker:theme`), because a tiny script in `index.html` must read it before the page first paints.

### Demo data

Demo transactions are ordinary transactions with `isDemo: true` and IDs like `demo-2026-11-rent`, so every feature handles them exactly like real data.

- **Clearing** them is a simple filter on that flag, so your own records can't be affected.
- **Loading** again replaces the previous demo set instead of duplicating it.
- **The generator is deterministic:** the same month always gets the same amounts.

## Testing

```bash
npm test          # run once
npm run test:watch
```

The suite covers:

- **Pure logic:** money parsing and formatting, date maths (month ends, leap years), schemas, the reducer, monthly summaries, the demo generator.
- **Storage:** missing, corrupted, partly invalid, newer-version and unavailable data, plus storage-full errors.
- **User journeys,** rendered through the real routes and providers: adding, editing and deleting transactions, validation and focus, month switching, themes, and loading and clearing demo data.

**Tests never depend on the real date or timezone:**

- They run with `TZ=America/Los_Angeles`, so any accidental UTC conversion shifts a date and fails the test.
- "Today" is passed in or faked.

jsdom doesn't implement `<dialog>.showModal()` or `matchMedia`, so `src/test/setup.ts` provides minimal stand-ins. Real dialog behaviour (focus and Escape) has also been checked in a browser.

## Data and privacy

- **Your data never leaves your browser.** There's no backend, analytics or external API.
- **It's stored in `localStorage` for this site,** so clearing your browser's site data, or using a private window, removes it. It isn't shared between browsers or devices.
- **Back it up:** CSV export (Phase 3) will let you keep your own backups.

## Known limitations

- **GBP only,** by design. There is no currency conversion.
- **Single device and browser,** with no sync.
- **The production JavaScript bundle is about 550 kB** (about 165 kB gzipped), so `vite build` prints a chunk-size warning. Route-level code-splitting is planned for Phase 4.
- **Budgets, Analytics and Savings Goals are placeholders** for now and are clearly labelled "Coming soon".

## Roadmap

- **Phase 1 — Foundation ✅:** project setup and CI, app layout, themes, data layer, transactions, dashboard, demo data.
- **Phase 2 — Budgets and analytics:** monthly and category budgets, interactive charts, reporting ranges (last 3/6/12 months), transaction search, filters and sorting.
- **Phase 3 — Advanced features:** recurring transactions, savings goals, CSV import and export, more settings including a safe data reset.
- **Phase 4 — Portfolio polish:** responsive and accessibility review, code-splitting, screenshots, deployment, and a licence.
