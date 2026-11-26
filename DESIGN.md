---
name: Finance Tracker
description: A private, accessible personal finance tracker for everyday UK users. Premium, minimalist fintech with figures first.
---

<!-- SEED: design direction set by the owner on 2026-11-26, before the redesign is implemented. The current code still uses the previous look (Inter, softer radii, pill badges). Values below are targets, not yet tokens in code. Re-run /impeccable document once the redesign is built, so the frontmatter carries the real tokens and the sidecar is generated. -->

# Design System: Finance Tracker

## Overview

**Creative North Star: "The Quiet Ledger"**

Finance Tracker should feel like a well-kept ledger on a dark desk: precise, calm and private. The numbers are the hero. Each screen leads with the one figure that answers the user's question ("How much can I still spend?", "Did I earn more than I spent?"). Supporting figures sit compactly beneath it, and detail follows as open rows and tables rather than boxes. It's premium through restraint and craft: exact alignment, tabular figures, a disciplined colour vocabulary and nothing decorative. It shouldn't rely on effects.

The references set the craft bar, not the look to copy: Copilot Money (figure-led finance screens), Linear (density, crisp hierarchy, quiet chrome) and Monzo (approachable, plain-spoken money language). The app must stay recognisably its own: turquoise on near-black, open rows and a circular budget gauge as its signature.

It's sophisticated but approachable, modern without trendiness, compact without crowding, and professional without being corporate. A first-time user with no financial knowledge should understand every screen. A recruiter should see that every element was placed on purpose.

**Key Characteristics:**

- A figure-first hierarchy: one prominent figure per screen, then compact supporting metrics, then detail.
- Near-black neutral grounds with tonal layering and hairline borders, and almost no shadows.
- Turquoise as a rare signature, amber for "watch this", and red for "this is negative or critical".
- Geist with tabular numbers for every financial figure.
- Open rows and tables instead of grids of equal cards.
- The same design language in light and dark modes.

**Reference screens** (owner-supplied, the foundation of the direction rather than pixel specifications):

- **Dashboard ("Overview"):**
  - a prominent net cash flow figure with a one-line plain-English reading
  - three compact metrics (income, expenses, savings rate)
  - an income vs expenses bar chart beside a monthly budget summary (remaining to spend, a progress bar, spent vs limit, one status sentence)
  - a clean recent-activity table (description, date, amount)
- **Budgets:**
  - a hero panel with the prominent amount available to spend, days remaining, and a circular "% used" gauge on the right
  - a hairline divider, then three compact metrics (budget, spent, daily allowance)
  - category budgets as open rows: icon tile, name, "£spent of £limit", percentage, an overflow menu, a full-width thin progress bar, and the amount remaining

## Colors

The palette is restrained: neutral near-black grounds, one signature accent, and two status colours that only appear when they mean something.

### Primary

- **Signature Turquoise** (`#38C4A0`):
  - Uses: the primary action, the active navigation item, the income series in charts, positive figures and the focus ring in dark mode.
  - On a turquoise fill, text is near-black `#101113` (8.6:1).
  - In light mode, the turquoise fill keeps the near-black label, but turquoise text, links, thin bars and the focus ring use **Deep Turquoise** (`#0B7A62`, 5.3:1 on white), because `#38C4A0` is only 2.2:1 on white.

### Status

- **Watchful Amber** (`#F8BD68` dark; proposed `#985800` light): approaching a limit ("Nearing limit"), a target date passed, and anything that needs attention but isn't yet wrong. In the hero figure, amber means "you're close".
- **Alert Red** (`#F87171` dark; proposed `#C42B2B` light): over budget, negative cash flow, expenses shown as negative amounts where the sign matters, and destructive actions.
- **Positive** uses Signature Turquoise rather than a separate green. This keeps the palette to one accent hue plus two status hues.

### Neutral (dark mode, the reference)

- **Ink Black** (`#101113`): page background.
- **Graphite** (`#181A1D`): surfaces (panels, the chart area, dialogs).
- **Raised Graphite** (`#22252A`): elevated surfaces (icon tiles, progress-bar tracks, hover rows, menus).
- **Paper White** (`#F4F4F5`): primary text and key figures (14.0:1 or more on every surface).
- **Pewter** (`#A1A1AA`): secondary text, labels and column headers (6.0:1 or more on every surface).
- **Hairline** (`#2C2E33`): card edges, dividers and table rules. These are decorative only, never the only boundary of a control.
- **Field Edge** (`#6B6F78`): form field outlines and other control boundaries (3.0:1 or more against every surface; WCAG 1.4.11). It replaces Hairline wherever a boundary identifies a control.

### Neutral (light mode, proposed: confirm with the theme contrast test when implementing)

The same roles, with lightness inverted:

- background `#F6F7F8`
- surface `#FFFFFF`
- elevated `#EEF0F2`
- primary text `#111214`
- secondary text `#5C5F66` (5.6:1 or more)
- hairline `#E3E5E8`
- field edge `#8B8F96` (3.0:1 or more)

Light mode must feel like the same product in daylight, not a different theme.

### Charts

- **Income:** Signature Turquoise (Deep Turquoise in light mode).
- **Expenses:** a neutral grey (`#6B6F78` dark / `#8B8F96` light) rather than red, so spending isn't framed as alarming by default.
- **Gridlines:** dashed, in Hairline.
- **Category breakdown:** keeps a distinct-hue categorical palette, at matched lightness so no category shouts. Turquoise is reserved for the primary series.

### Named Rules

**The Rare Turquoise Rule.** Turquoise appears on at most about 10% of any screen: one primary action, the active nav item, the income series, positive values and focus. It is never a background wash, a decorative border or a heading colour. Its rarity is what makes it a signature.

**The Status Means Something Rule.** Amber and red only appear when the data is in that state. A screen where everything is fine shows no amber or red at all.

**The Never Colour Alone Rule.** Every status colour sits beside words or a sign: "Nearing limit", "Over budget", "−£71.15", "97% used". Colour reinforces the meaning and never carries it alone.

## Typography

**Font:** Geist (UI and figures), falling back to `ui-sans-serif, system-ui, sans-serif`.
**Figures:** Geist with `font-variant-numeric: tabular-nums`, so columns of money line up digit for digit.

> **Dependency note:** Geist isn't installed. The current app uses Inter (installed through Fontsource). Adding Geist (for example the Fontsource Geist package) is a new dependency and **needs the owner's approval** before implementation. Until it's approved, the type rules below apply to Inter.

**Character:** one neutral, engineered sans for everything. Hierarchy comes from size, weight and colour, never from mixing families.

### Hierarchy (targets)

- **Hero figure** (600, 40px desktop / 32px phone, line-height 1.1, letter-spacing −0.02em, tabular): the one answer per screen, such as net cash flow or available to spend. It's coloured by state (Paper White normally, turquoise for positive emphasis, amber when close, red when over).
- **Page title** (600, 24px, 1.2): "Overview", "Budgets", with the period beneath in secondary text ("November 2026").
- **Section title** (600, 17–18px, 1.3): "Cash flow", "Category budgets", "Recent activity".
- **Metric value** (600, 18–20px, tabular): supporting figures (income, expenses, savings rate, budget, spent).
- **Body** (400, 14–15px, 1.5): row text, descriptions and status sentences. Keep explanatory text to about 70 characters per line.
- **Label** (400–500, 13–14px, Pewter): metric labels, column headers and "£x of £y" lines. Sentence case, never tracked uppercase.

### Named Rules

**The Tabular Money Rule.** Every amount, percentage and count in a row, table, metric or chart axis uses tabular numbers, and amounts align on the right in tables. The minus sign is a true minus (−) followed directly by £, and positive cash flow shows an explicit "+".

**The One Loud Number Rule.** Each screen has exactly one hero figure. Supporting figures are visibly smaller. Two figures at hero size compete, and the user no longer knows where to look.

## Layout

- **Model:** a single main column beside the existing sidebar (desktop) or menu drawer (phone), with a maximum content width of about 1200px.
- **Rhythm:** a 4px base. Panels use 16–20px inner padding, related items have 12–16px gaps, and sections have 24–32px gaps. It should be compact, but never cramped.
- **Composition:**
  - **Header row:** the page title and period on the left, actions on the right (Demo data switch, primary action).
  - **Hero:** the hero figure with a one-line plain-English reading beneath it ("You've spent less than you've earned this month.").
  - **Supporting metrics:** a single compact row of 3 (it may wrap to 2 + 1 or stack on phones).
  - **Detail:** asymmetric two-column panels where content differs (chart beside summary), then open lists or tables.
- **Breadth before boxes:** prefer open regions separated by space and hairlines over wrapping every group in its own card. Use a panel only where grouping aids scanning, such as a chart, the budget hero or a summary.
- **Responsive:**
  - Below about 768px, two-column regions stack: the chart first, then the summary.
  - The metrics row becomes a 2-column grid or a stacked list.
  - Tables become stacked rows that keep the amount right-aligned.
  - Everything must reflow at 320px with no horizontal scrolling (a PRODUCT.md commitment).

## Elevation & Depth

The design is flat. Depth comes from tonal layering (Ink Black, then Graphite, then Raised Graphite) and 1px Hairline borders, never from shadows on panels or cards.

### Shadow Vocabulary

- **Dialog only** (a subtle, large, soft shadow on dialogs and menus, for example `0 12px 32px rgb(0 0 0 / 0.35)` in dark mode and a lighter equivalent in light mode): used only to separate an overlay from the page beneath. Nothing else casts a shadow.

### Named Rules

**The Flat Ledger Rule.** Surfaces are flat at rest and stay flat on hover. A hover state changes the tone (to Raised Graphite), never adds a shadow or a lift.

## Shapes

- **Radii are restrained:**
  - 4px: small elements (icon tiles, tags, checkboxes)
  - 6px: controls (buttons, inputs, selects, segmented controls)
  - 10px: panels and dialogs
- **No pills except progress bars.** Progress bars and the gauge track have rounded ends. Badges, status labels and buttons are never pill-shaped.
- **Borders:** 1px Hairline for structure, 1px Field Edge for controls. No double borders or inset outlines.
- **Signature geometry:** the circular budget gauge. It's a single ring stroke on a Raised Graphite track, with the percentage in the centre at metric size and "used" beneath. It's coloured by state and accompanied by the status in words.

## Components

These describe the target; the current code still uses the earlier look.

### Buttons

- **Shape:** 6px radius, compact height (40px desktop / 44px minimum touch target on phones), modest horizontal padding.
- **Primary:** Signature Turquoise fill with a near-black label (`#101113`), and an icon plus label ("+ Transaction"). At most one per view.
- **Secondary:** transparent, 1px Field Edge border and a Paper White label.
- **Ghost / icon:** no border. Pewter, changing to Paper White on hover, with a Raised Graphite hover tone.
- **Focus:** the existing 2px focus outline, in turquoise (Deep Turquoise in light mode), offset by 2px.

### Status labels (replacing pill badges)

- **Style:** inline text in the status colour with a small leading icon ("⚠ Nearing limit"), not a filled pill.
- **"Demo" marker:** plain secondary text after a middle dot ("£274.80 of £300 · Demo"), not a badge.

### Panels

- **Corner style:** 10px.
- **Background:** Graphite on Ink Black.
- **Border:** 1px Hairline.
- **Shadow:** none.
- **Padding:** 16–20px.
- **Use:** only where grouping helps (the budget hero, a chart, a summary).

### Supporting metric

- A small label (Pewter) above a metric value (Paper White, tabular).
- Tiles are optional. When the metrics sit inside a hero panel (Budgets), they're bare figures in a 3-column row under a hairline divider.

### Category budget row

The signature list item:

- a 40px icon tile (Raised Graphite, 4px radius)
- the category name (body, Paper White)
- "£spent of £limit" (label, Pewter), with "· Demo" when relevant
- on the right: the percentage (tabular) and its status in words, plus an overflow menu (⋯) for edit and delete
- beneath: a full-width 6px progress bar on a Raised Graphite track, coloured by state
- then "£x remaining" (label)

Rows are separated by hairlines, not boxed.

### Budget gauge

- A ring of about 160px desktop / 112px phone, as described in Shapes.
- It's an SVG drawn with existing tools, so no chart dependency.
- It must have an accessible text equivalent ("97% of your monthly budget used, nearing limit").

### Data table (recent activity)

- Column headers in label style.
- Rows have about 48px height, with hairline rules and no zebra striping.
- The amount is right-aligned and tabular, and red only when the meaning needs it.
- The category icon is inline at 16px.
- On phones it collapses to stacked rows.

### Charts

- Recharts, themed with the tokens above.
- Bars with small top radii (2px), dashed hairline gridlines, and a minimal legend of dot plus label.
- No gradients or glows, and no animation beyond what reduced-motion allows.
- Every chart keeps its written summary and data table (an existing accessibility commitment).

### Inputs / fields

- Graphite fill, 1px Field Edge border, 6px radius.
- The focus outline is turquoise.
- Errors show a red border plus a message linked to the field.
- Labels always sit above the field (no placeholder-only labels).

### Navigation

- Sidebar items are body text in Pewter. Hover uses a Raised Graphite tone.
- The active item is Paper White with a turquoise indicator (a small left bar or icon tint), not a filled turquoise block.
- On phones, the existing drawer keeps the same styling.

## Do's and Don'ts

### Do:

- **Do** lead every screen with one hero figure and a plain-English sentence that reads it for the user.
- **Do** use tabular numbers for every amount, and right-align amounts in tables.
- **Do** keep turquoise rare: one primary action per view, positive values, the income series, active nav and focus.
- **Do** use amber only for "approaching" states and red only for "negative or over" states, always with words beside them.
- **Do** separate groups with space and 1px Hairline rules before reaching for a panel.
- **Do** use Field Edge (`#6B6F78` dark / `#8B8F96` light) for any border that identifies a control.
- **Do** keep light and dark modes the same layout, hierarchy and roles, with only lightness inverted, and use Deep Turquoise for turquoise text in light mode.
- **Do** keep the existing product language and controls (the "Demo data: On/Off" switch, "Add budget", status words) unless the owner approves a copy change.
- **Do** keep every chart's text summary and data table, the focus outline, 320px reflow and reduced-motion support.

### Don't:

- **Don't** build generic AI dashboard layouts: no repeating grids of equally sized cards, no "stat card, stat card, stat card, chart card" template on every page.
- **Don't** use corner radii above 10px, pill-shaped badges or buttons, or a badge for every row.
- **Don't** use gradients, glassmorphism, glows, blur or decorative illustrations.
- **Don't** add shadows to panels, cards or hover states. Dialogs and menus are the only exception.
- **Don't** make buttons, icons or containers oversized, or pad sections with excess whitespace.
- **Don't** add animation that doesn't explain a change of state. No entrance animations, count-ups or bouncing.
- **Don't** use turquoise for headings, backgrounds, decorative borders or more than one primary button per view.
- **Don't** rely on colour alone for any status, or show a percentage, gauge or bar without its value in text.
- **Don't** change financial calculations, data models, storage or demo data controls as part of a design change. New figures need the owner's approval first (see below).

## Open decisions (need the owner's approval before implementation)

- **Geist font:** a new dependency. Until it's approved, use Inter.
- **"Daily allowance" and "days remaining this month"** (Budgets reference): these are new derived figures (remaining ÷ days left), not existing calculations. Adding them changes product behaviour, so they need approval and their own tested logic. The rounding rule also needs deciding.
- **Copy changes seen in the references:**
  - "Overview" for Dashboard
  - "+ New budget" for "Add budget"
  - "Demo mode" for the "Demo data" switch
  - "Available to spend" and "Remaining to spend" wording

  Keep the current wording until each change is approved.

- **Light-mode values:** proposed above. They must pass `src/styles/themeContrast.test.ts` when implemented.
- **Positive colour:** this direction merges the separate green into turquoise. Confirm this when implementing, since it changes the "Goal reached" and "On track" colour.
