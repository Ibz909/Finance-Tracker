---
version: 1
slug: "src-features-recurring-recurringpage-tsx"
primary_target: "src/features/recurring/RecurringPage.tsx"
related_targets: ["src/components/ui/MonthCalendar.tsx"]
---

## Scope
Recurring page, Operate mode. Audience: an everyday user checking their regular income and bills; a recruiter with Demo data. Job: see this month's recurring money, when it lands, what's next, and manage every item (add, edit, pause/resume, delete). Constraints: presentation only. The calendar and totals are derived from existing schedules and posted transactions; no data model, storage or catch-up changes. The month is the shared reporting month.

## Direction contract
THESIS: A month of regular money at a glance: what it adds up to, which days it lands on, what's next, then every item. Refused: the bordered card list with three icon buttons per row, pills, and a hero figure.
OWN-WORLD: The Quiet Ledger (DESIGN.md): near-black grounds, hairline rules, turquoise only for income, today and focus, Geist with tabular figures, 6px controls, outlined page-level add, status in words.
STORY: The visitor reads the month heading and three framed figures (Recurring income, Recurring expenses, Active items), scans the calendar where a filled turquoise dot marks money in and a grey ring marks money out, picks a day to see its payments marked Paid or Due, reads the next five payments, then manages items from open rows with a ⋯ menu.
FIRST VIEWPORT: Explanatory line with an outlined "Add recurring transaction". The month as a heading, then three framed metrics (the owner later removed Net recurring as unnecessary). Two columns from xl: the calendar card (month heading, ‹ › arrows, Monday-first grid, today outlined in turquoise, day net where it fits whole) on the left; the selected day and Upcoming as open rows on the right. Stacked on phones in the same order, then "All recurring" (Active, Paused or ended).
FORM: seed: none (pinned) — owner, 2026-11-26 (/impeccable layout): a header with title, add action and summary text; a summary of recurring income, recurring expenses, net recurring and active count for the selected month; a calendar with month navigation, markers, multiple items per day, income/expense distinction, date selection showing its items, today highlighted; an Upcoming section in date order with name, amount, category, frequency and next due date; the full list keeping edit, delete and pause/resume; two columns on desktop, stacked on mobile; accessible and keyboard operable. The owner chose "Keep in step" for the month and "Outlined" for the add button, then answered "Approve, build it".
FINISH: reviewed 2026-11-26 (verdict: fix); all four material fixes applied: Demo marker on every payment row, a visible month heading over the summary, a no-wrap Upcoming date column, and calendar numbers and markers on one left edge.
