---
version: 1
slug: "src-features-transactions-transactionspage-tsx"
primary_target: "src/features/transactions/TransactionsPage.tsx"
related_targets: []
---

## Scope
Transactions page, Operate mode. Audience: an everyday user finding, checking and fixing records; a recruiter with Demo data. Job: search, filter, sort, export, edit and delete transactions. Constraints: presentation only, apart from an owner-approved In/Out total for the filtered view. Filters stay in the URL.

## Direction contract
THESIS: A ledger you browse by month. Pick a period, see what it adds up to, narrow it, then scan the days. Refused: the bordered card list with per-row icon buttons, pills, and a hero figure.
OWN-WORLD: The Quiet Ledger (DESIGN.md): near-black grounds, hairline rules, turquoise only for income amounts, the active type and focus, Geist with tabular figures, 6px controls, no shadows except menus.
STORY: The visitor picks a month (or All time) from the strip, reads income, expenses, net and the count for exactly what's listed, narrows with search, quick type and the Filters panel (category, custom dates, sort), then scans day-grouped rows under sticky date headers with daily totals, and edits or deletes from a row menu.
FIRST VIEWPORT: A month strip: All time, a ‹ year › switcher, Jan–Dec, the selected month in turquoise with an underline. The period heading with its count and an outlined Export. A compact summary panel: Income and Expenses on one bar scale on the left, Net cash flow and Transactions on the right. A toolbar: search, All/Income/Expenses, Filters (n). An active-filters line with Reset. Day headers on a muted band (Today/Yesterday/weekday + date, day net at right), then rows with icon tiles.
FORM: seed: none (pinned) — owner, 2026-11-26 (/impeccable layout): "Introduce a dedicated month navigation component above the transaction list… Display selectable month tabs with abbreviated month names… Clearly highlight the selected month using the signature turquoise accent and a subtle underline… Replace the current plain In and Out totals with a compact, visually refined monthly summary… Include subtle horizontal comparison bars… Introduce a compact, full-width date header with a subtly contrasting background… Display the daily net transaction total on the right side of each date header." The owner then answered "Approve, build it" to the posted plan.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
