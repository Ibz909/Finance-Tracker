# Finance Tracker

[![CI](https://github.com/Ibz909/Finance-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Ibz909/Finance-Tracker/actions/workflows/ci.yml)

A personal finance tracker for recording income and spending in GBP and seeing your monthly cash flow at a glance. Built with React, TypeScript and Tailwind CSS. **Everything stays in your browser:** there is no server, no account and no tracking.

> **Status:** Phases 1 (the working foundation) and 2 (budgets and analytics) are complete. Recurring transactions, savings goals and CSV import/export come next; see the [roadmap](#roadmap).

## Features

- **Transactions:** add, edit and delete income and expenses, with a description, category, date and optional notes. Every field is validated, with clear messages linked to the field that needs fixing.
- **Monthly dashboard:** income, expenses, net cash flow and savings rate for any month, plus that month's recent transactions. The figures update the moment your data changes.
- **Reporting month picker:** step backwards and forwards through months, or jump back to the current one.
- **Budgets:** set one overall monthly limit and one per expense category. Each budget shows what's spent and left, with a status in words: _On track_, _Nearing limit_ (75% or more) or _Over budget_. The dashboard shows an overview for the selected month.
- **Analytics:** income vs expenses by month, a spending trend, and a category breakdown with a ranked list. Every chart has a written summary and an optional data table with the exact figures.
- **Date ranges:** this month, last month, or the last 3, 6 or 12 months. The range is kept in the URL, so it survives a refresh and the Back button works.
- **Search, filters and sorting:** find transactions by description, type, category and date range, and sort by date or amount. Filters are kept in the URL too, and the page says how many results match.
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
| Charts     | Recharts                       | Composable SVG charts; themed through the same CSS variables and loaded only when a chart is shown.      |
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
│   ├── charts/     Chart cards, Recharts charts (lazy-loaded) and accessible data tables
│   ├── layout/     App shell: sidebar, top bar, mobile drawer, banners
│   └── ui/         Reusable pieces: Button, Dialog, FormField, StatCard…
├── constants/      Categories, budget thresholds, money limits, navigation, storage keys
├── context/        Providers: app data (with reducer), theme, toasts, dialogs, month
├── features/       One folder per feature, holding its components and pure logic
│   ├── analytics/  Range presets, chart data and the analytics page
│   ├── budgets/    Budget progress maths, forms and cards
│   ├── dashboard/  Monthly summary calculations and dashboard UI
│   ├── demo/       Deterministic demo-data generator
│   ├── savings/    Savings goals page (coming soon)
│   ├── settings/   Appearance and demo data settings
│   └── transactions/ Form, list, schemas, search, filters and sorting
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

Data is saved under `finance-tracker:data` as `{ schemaVersion, data }`; the current version is **2**. When the shape changes, a migration upgrades older data step by step. Budgets were added this way: version 1 data had no budget list, so the first migration adds an empty one.

```ts
export const MIGRATIONS = {
  1: (data) => (isRecord(data) ? { ...data, budgets: [] } : data), // v1 → v2
};
```

Each migration is pure, never drops data it doesn't understand, and is covered by tests. Later features (savings goals, recurring transactions) will add their collections the same way.

On load:

- **Invalid records** are skipped one by one rather than discarding everything.
- **Duplicate IDs** are dropped.
- **Unreadable data** is copied to a `finance-tracker:data-backup:<timestamp>` key **before** anything is rewritten. If the backup can't be written, the original is left untouched.
- **Data from a newer app version** is preserved rather than overwritten.

The theme preference has its own key (`finance-tracker:theme`), because a tiny script in `index.html` must read it before the page first paints.

### Budgets

Budgets are standing monthly limits: set once, they apply to every month, and spending is counted per calendar month from expense transactions. Totals are never stored.

- **The overall budget is separate** from category budgets, because spending in categories without a budget still counts towards it. Adding up category limits would miss it.
- **Status thresholds compare whole numbers.** A budget is over at 100% and nearing its limit at 75%, checked as `spent × 100 ≥ limit × 75` rather than with a division, so exactly 75% can never be misjudged by floating-point rounding.
- **One budget per scope.** You can't create two budgets for the same category, and demo budgets never replace one of yours.

### Charts

- **One data source per chart.** The same pure, tested function produces the chart's data, its written summary and its data table, so they can't disagree.
- **Accessible by design.** Charts are decorative for screen readers; the summary and table carry the information. Colours come from theme tokens, and every category is also labelled in text.
- **"No records" is not £0.** Months before your first transaction show as gaps in the trend, not as a drop to zero, and a trend needs at least two months of spending.
- **Loaded on demand.** The chart code (mostly Recharts) is about 360 kB, so charts are lazy-loaded with `React.lazy`. The figures and summaries appear straight away.

### URL state

The analytics range and the transaction filters live in the URL rather than in component state, so a view can be refreshed, bookmarked or shared.

- **Changing the range adds a history entry,** so Back returns to the previous range.
- **Filters replace the current entry,** so Back leaves the page instead of undoing one keystroke at a time.
- **Rapid updates are chained.** React Router's `setSearchParams` builds on the URL from the last render, so two changes in a row (such as typing quickly) could lose one. Filter updates build on a ref holding the latest parameters instead, and a regression test covers it.

### Demo data

Demo transactions and budgets are ordinary records with `isDemo: true` and IDs like `demo-2026-11-rent`, so every feature handles them exactly like real data.

- **Clearing** them is a simple filter on that flag, so your own records can't be affected.
- **Demo budgets** skip any category where you already have a budget.
- **Loading** again replaces the previous demo set instead of duplicating it.
- **The generator is deterministic:** the same month always gets the same amounts.

## Testing

```bash
npm test          # run once
npm run test:watch
```

The suite has 414 tests in 37 files and covers:

- **Pure logic:** money parsing and formatting, date maths (month ends, leap years), schemas, the reducer, monthly summaries, budget progress and thresholds, chart data and range presets, filtering and sorting, the demo generator.
- **Storage:** missing, corrupted, partly invalid, newer-version and unavailable data, storage-full errors, and the v1 → v2 migration.
- **User journeys,** rendered through the real routes and providers: adding, editing and deleting transactions and budgets, validation and focus, month and range switching, chart summaries and tables, search and filters (including URL state and rapid typing), themes, and loading and clearing demo data.

**Tests never depend on the real date or timezone:**

- They run with `TZ=America/Los_Angeles`, so any accidental UTC conversion shifts a date and fails the test.
- "Today" is passed in or faked.

jsdom doesn't implement `<dialog>.showModal()`, `matchMedia` or `ResizeObserver`, so `src/test/setup.ts` provides minimal stand-ins. Real dialog behaviour (focus and Escape) has also been checked in a browser.

## Data and privacy

- **Your data never leaves your browser.** There's no backend, analytics or external API.
- **It's stored in `localStorage` for this site,** so clearing your browser's site data, or using a private window, removes it. It isn't shared between browsers or devices.
- **Back it up:** CSV export (Phase 3) will let you keep your own backups.

## Known limitations

- **GBP only,** by design. There is no currency conversion.
- **Single device and browser,** with no sync.
- **Budgets are monthly only.** There are no weekly or yearly budgets, and a limit can't change from month to month.
- **The main JavaScript bundle is about 585 kB** (about 177 kB gzipped), so `vite build` prints a chunk-size warning. Recharts is already in its own lazy-loaded chunk; route-level code-splitting is planned for Phase 4.
- **Savings goals are a placeholder** for now and are clearly labelled "Coming soon".

## Roadmap

- **Phase 1 — Foundation ✅:** project setup and CI, app layout, themes, data layer, transactions, dashboard, demo data.
- **Phase 2 — Budgets and analytics ✅:** monthly and category budgets, interactive charts, reporting ranges (last 3/6/12 months), transaction search, filters and sorting.
- **Phase 3 — Advanced features:** recurring transactions, savings goals, CSV import and export, more settings including a safe data reset.
- **Phase 4 — Portfolio polish:** responsive and accessibility review, code-splitting, screenshots, deployment, and a licence.
