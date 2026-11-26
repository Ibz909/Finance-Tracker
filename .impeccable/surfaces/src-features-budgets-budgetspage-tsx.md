---
version: 1
slug: "src-features-budgets-budgetspage-tsx"
primary_target: "src/features/budgets/BudgetsPage.tsx"
related_targets: []
---

## Scope
Budgets page, Operate mode. Audience: an everyday user checking how much they can still spend; a recruiter with Demo data. Job: know what's left this month, overall and per category, and edit limits. Constraints: presentation only, plus new tested daily-allowance and days-remaining helpers (owner-approved). Keep the distinction between the monthly budget and independent category budgets.

## Direction contract
THESIS: What's left, not what's spent. Available to spend leads, with a ring gauge as the signature; the grid of equal budget cards is refused.
OWN-WORLD: The Quiet Ledger (same palette, type and shapes as Overview). The ring is a single stroke on a Raised Graphite track, coloured by status, with its percentage and status in words.
STORY: The visitor sees available to spend, the days left and the ring, reads budget, spent and daily allowance, then scans category rows for anything amber or red and edits limits from the row menus.
FIRST VIEWPORT: Header with "Budgets", the month and the demo indicator, plus "+ Add budget". A hero panel: "Available to spend" figure, days remaining and the ring on the right, then a hairline and 3 bare metrics (budget, spent, daily allowance). Then "Category budgets" with an explanation, and open rows (icon tile, name, £spent of £limit · Demo, % and status, ⋯ menu, a thin bar, £ remaining).
FORM: seed: none (pinned) — "Closely follow the attached Budgets screenshot: Make available spending allowance the primary figure. Include a circular progress indicator... Replace individual oversized category cards with compact horizontal budget rows".
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
