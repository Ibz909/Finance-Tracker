---
version: 1
slug: "src-features-dashboard-dashboardpage-tsx"
primary_target: "src/features/dashboard/DashboardPage.tsx"
related_targets: []
---

## Scope
Overview (Dashboard) page, Operate mode. Audience: an everyday UK user with no financial knowledge, doing a quick monthly check-in; a recruiter doing a 2-minute look with Demo data. Job: understand "how am I doing this month?" at a glance. Constraints: presentation only (no changes to calculations, models or storage), keep the month picker and all actions, keep Demo labelling.

## Direction contract
THESIS: One answer first. Net cash flow leads as the single hero figure with a plain sentence that reads it; the stat-card-grid admin dashboard is refused.
OWN-WORLD: The Quiet Ledger. The ground is Ink Black #101113, with Graphite #181A1D panels and Raised Graphite #22252A tracks and tiles. Hairline #2C2E33 rules. Turquoise #38C4A0 is rare (income, positive, primary action, focus); amber #F8BD68 is used only when nearing a limit, red #F87171 only when over or negative. Geist with tabular figures. Radii 4/6/10, flat, open rows, no pills.
STORY: The visitor reads net cash flow and its sentence, glances at income, expenses and savings rate, sees the cash flow trend beside how much budget is left, then scans recent activity. They leave knowing whether the month is fine.
FIRST VIEWPORT: Header with "Overview", the month and the demo indicator, plus Demo switch and "+ Add transaction" at top right. Hero figure at 40px with a sentence. A compact 3-metric row. A two-column panel: income vs expenses bars with a 3/6/12-month range on the left (wider), the monthly budget summary on the right. The recent activity table below.
FORM: seed: none (pinned) — "Closely follow the attached Overview screenshot: Make net cash flow the primary financial figure... Position a monthly budget summary alongside the chart... compact recent transactions table".
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
