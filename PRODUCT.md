# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: everyday users.** People in the UK managing their own money in pounds sterling. They record income and spending, set monthly limits, keep track of regular bills and salary, and save towards goals. They use it on a laptop or a phone, often in a short check-in ("how am I doing this month?") rather than a long session.

**Secondary: recruiters and hiring managers.** The app is also the owner's portfolio project. These visitors arrive through the live link or the GitHub repository, usually for a few minutes, and turn on Demo data to see it working. They judge the project by how well it does the everyday user's job, so design for the everyday user first and never at their expense.

## Product Purpose

A personal finance tracker that shows where your money goes, whether you're staying within your budgets, and how close you are to your savings goals, without handing your financial data to anyone. Success for a user is a quick, trustworthy answer about their month and confidence that the numbers are right. Success for the portfolio is that a visitor can see a finished, careful, professional product within a minute of opening it.

## Positioning

All four of these are confirmed points of difference that later work must protect:

- **Private by design.** There's no server, no account and no tracking. Data stays in the user's own browser.
- **Accessible.** It's built to WCAG 2.2 AA. Keyboard use, screen readers, contrast and status written in words are requirements, not extras.
- **Exact, trustworthy maths.** Money is stored as integer pence. Totals, balances, budget progress and savings are always calculated from the records, never stored, so they can't drift. Rounding favours reaching the goal (monthly savings amounts round up).
- **Calm and simple.** It's clear at a glance, with plain language and no jargon, pressure or alarm.

## Operating Context

- **One browser on one device.** Data lives in that browser's `localStorage`. Clearing site data or using a private window removes it. CSV export is the user's backup.
- **Monthly rhythm.** The dashboard, budgets and analytics are viewed per reporting month (month picker), plus 3-, 6- and 12-month ranges on Analytics.
- **Recurring catch-up.** Recurring payments are added on their due dates the next time the app is opened, including any that fell due while it was closed. The user is told what was added.
- **Bank data via CSV.** Users may import transactions exported from spreadsheets or banks. Imports are validated row by row and previewed before saving, with duplicates skipped.
- **Demo data.** A top-bar switch (Demo data: Off/On) loads six months of clearly labelled fictional data: transactions, budgets, recurring schedules (one paused) and savings goals. It starts off for every visitor, and turning it off removes only demo records.
- **Live site.** https://ibz909.github.io/Finance-Tracker/ (GitHub Pages). It deploys automatically after CI passes on `main`. The source is a public GitHub repository.

## Capabilities and Constraints

**Capabilities:**

- **Transactions:** add, edit and delete, then search, filter and sort. Filters are kept in the URL.
- **Dashboard:** income, expenses, net cash flow and savings rate for the month, plus recent activity, budget and goal summaries, and charts.
- **Budgets:** one overall monthly limit plus one per spending category. Statuses are _On track_, _Nearing limit_ and _Over budget_.
- **Analytics:** income vs expenses, a spending trend and a category breakdown. Every chart has a written summary and a data table.
- **Recurring schedules:** weekly, fortnightly, monthly or yearly. They can be paused, resumed (which skips missed payments) and edited. Dates are always counted from the start date.
- **Savings goals:**
  - Deposits and withdrawals are recorded separately from transactions; saving isn't spending.
  - A withdrawal can't exceed the goal's balance.
  - If the goal has a target date, it shows the monthly amount needed.
  - Statuses are _Reached_ and _Target date passed_.
- **CSV import/export** of transactions, protected against spreadsheet formula injection.
- **Themes:** light, dark or follow the device.
- **Safe reset:** the user types a confirmation word, with an option to export first.

**Firm constraints:**

- **No backend for now.** Accounts and sync are undecided. Don't design as if they exist.
- **Ask before adding any dependency.** The stack is React 19 + strict TypeScript, Vite, Tailwind CSS v4, React Router, Recharts, Lucide, date-fns, React Hook Form and Zod.
- **Light and dark themes.** Every screen must work in both.
- **Design work is presentation only.** Design changes must not alter business logic, financial calculations or data storage, and must keep all existing functionality. Significant architectural changes need the owner's approval first.

**Current but not committed:**

- **GBP only.** The app is built for pounds today, but the owner hasn't made single-currency a permanent rule.
- **CSV covers transactions only,** not budgets, goals or schedules.

**Terminology** (use these terms consistently): transaction, income, expense, category, budget (overall / category), recurring schedule (active / paused), savings goal, deposit, withdrawal, reporting month, Demo data.

## Brand Commitments

- **Name:** Finance Tracker.
- **Design aim** (set by the owner): a distinctive, professional fintech design rather than generic app conventions. It sits alongside the "calm over clever" principle: the app should feel distinctive through precision and craft, not through noise.
- **Voice** (observed in the shipped copy, not separately confirmed): plain British English, sentence case, short reassuring sentences, typographic quotes and apostrophes ("You're viewing fictional demo data."). Status words are always written out.

## Evidence on Hand

- **Live app:** https://ibz909.github.io/Finance-Tracker/
- **Screenshots** of the fictional demo data: `docs/screenshots/dashboard-light.jpg`, `analytics-dark.jpg`, `budgets-mobile.jpg`
- **Quality evidence:**
  - a test suite of 690+ tests, including axe-core accessibility checks on every page and a theme contrast test
  - CI on every pull request
- **Not available, so never fabricate:** real users, testimonials, usage numbers, press or ratings. Any figures shown in the product or its marketing must come from the user's own data or the labelled demo data.

## Product Principles

1. **The user's data is theirs alone.** Nothing leaves the browser, and no design may imply an account, cloud or sync that doesn't exist.
2. **Numbers must be right before they're pretty.** Show exact figures. Derive, don't store. Never round in a way that misleads.
3. **Status in words, for everyone.** Colour, charts and icons support the meaning but never carry it alone. Every visual has a text equivalent.
4. **Calm over clever.** It should give a quick, clear answer about your money. Avoid alarm, jargon, gamification and pressure, even when someone is over budget.
5. **Fictional data is always obvious.** Demo content is labelled wherever it appears and never mixes silently with real records.

## Accessibility & Inclusion

- **Standard:** WCAG 2.2 AA, as a firm product commitment.
- **Keyboard:** full keyboard operation with a visible focus outline. Dialogs keep focus inside and return it to the button that opened them.
- **Screen readers:** form errors are linked to their fields, and changes are announced (for example "Transaction added" and filter result counts).
- **Layout:** it must reflow to 320px wide and cope with enlarged text spacing.
- **Motion:** it respects reduced-motion settings.
- **Still to verify:** a manual VoiceOver pass hasn't been done yet.
