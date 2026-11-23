import { getCategory } from '../../constants/categories';
import type { CategoryColor } from '../../models/category';
import type { Transaction } from '../../models/transaction';
import type { MonthKey } from '../../utils/dates';
import { formatMonthLabel, formatShortMonth, shiftMonth, toMonthKey } from '../../utils/dates';
import { formatPence } from '../../utils/money';

/** Months shown when no range has been chosen. */
export const DEFAULT_RANGE_MONTHS = 6;

/** The `count` calendar months ending with `end`, oldest first. */
export function monthsEndingAt(end: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(end, i - count + 1));
}

/** "Jun – Nov 2026", or "Dec 2025 – May 2026" across a year; one month: "November 2026". */
export function rangeLabel(months: readonly MonthKey[]): string {
  const first = months[0];
  const last = months[months.length - 1];
  if (!first || !last) return '';
  if (first === last) return formatMonthLabel(first);
  const sameYear = first.slice(0, 4) === last.slice(0, 4);
  return `${formatShortMonth(first, !sameYear)} – ${formatShortMonth(last, true)}`;
}

export interface MonthTotals {
  month: MonthKey;
  incomePence: number;
  expensesPence: number;
  netPence: number;
}

/**
 * Income and spending per month, in order, with explicit zeros for empty
 * months. One pass over the data; each transaction lands in at most one month.
 */
export function monthlyTotals(
  transactions: readonly Transaction[],
  months: readonly MonthKey[],
): MonthTotals[] {
  const totals = new Map(months.map((m) => [m, { incomePence: 0, expensesPence: 0 }]));
  for (const t of transactions) {
    const bucket = totals.get(toMonthKey(t.date));
    if (!bucket) continue;
    if (t.type === 'income') bucket.incomePence += t.amountPence;
    else bucket.expensesPence += t.amountPence;
  }
  return months.map((month) => {
    const { incomePence, expensesPence } = totals.get(month) ?? {
      incomePence: 0,
      expensesPence: 0,
    };
    return { month, incomePence, expensesPence, netPence: incomePence - expensesPence };
  });
}

export interface CategoryTotal {
  categoryId: string;
  label: string;
  color: CategoryColor;
  totalPence: number;
  /** Share of all spending in the range, to one decimal place. */
  sharePercent: number;
}

/** Spending per category across the months, largest first. Income is excluded. */
export function categoryBreakdown(
  transactions: readonly Transaction[],
  months: readonly MonthKey[],
): { totalPence: number; categories: CategoryTotal[] } {
  const inRange = new Set(months);
  const byCategory = new Map<string, number>();
  let totalPence = 0;

  for (const t of transactions) {
    if (t.type !== 'expense' || !inRange.has(toMonthKey(t.date))) continue;
    byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amountPence);
    totalPence += t.amountPence;
  }

  const categories = [...byCategory.entries()]
    .map(([categoryId, amount]) => {
      const category = getCategory(categoryId);
      return {
        categoryId,
        label: category?.label ?? 'Unknown category',
        color: category?.color ?? 'chart-12',
        totalPence: amount,
        sharePercent: Math.round((amount * 1000) / totalPence) / 10,
      };
    })
    .sort((a, b) => b.totalPence - a.totalPence || a.label.localeCompare(b.label));

  return { totalPence, categories };
}

/** The donut shows at most this many slices; the rest are grouped. */
export const MAX_DONUT_SLICES = 6;
export const GROUPED_CATEGORY_ID = 'everything-else';

/**
 * Keeps the largest categories and merges the rest into one
 * "Everything else" slice, so a donut never becomes a fan of slivers.
 * Totals are unchanged; the full list stays available elsewhere.
 */
export function groupSmallCategories(
  categories: readonly CategoryTotal[],
  maxSlices = MAX_DONUT_SLICES,
): CategoryTotal[] {
  if (categories.length <= maxSlices) return [...categories];
  const kept = categories.slice(0, maxSlices - 1);
  const rest = categories.slice(maxSlices - 1);
  return [
    ...kept,
    {
      categoryId: GROUPED_CATEGORY_ID,
      label: `Everything else (${String(rest.length)} categories)`,
      color: 'chart-12',
      totalPence: rest.reduce((sum, c) => sum + c.totalPence, 0),
      sharePercent: Math.round(rest.reduce((sum, c) => sum + c.sharePercent, 0) * 10) / 10,
    },
  ];
}

export interface TrendPoint {
  month: MonthKey;
  /** null for months before any records exist: unknown, not £0. */
  expensesPence: number | null;
}

/**
 * Spending per month for the trend line. Months before the first month
 * with any record are gaps rather than zeros, so a range that starts
 * before you began tracking doesn't show a misleading drop to £0.
 */
export function trendSeries(totals: readonly MonthTotals[]): TrendPoint[] {
  const firstTracked = totals.findIndex((t) => t.incomePence > 0 || t.expensesPence > 0);
  return totals.map((t, index) => ({
    month: t.month,
    expensesPence: firstTracked === -1 || index < firstTracked ? null : t.expensesPence,
  }));
}

export interface RangeSummary {
  incomePence: number;
  expensesPence: number;
  netPence: number;
  /** Months in the range from the first record onwards. */
  trackedMonths: number;
  /** Spending per tracked month, rounded to the penny; null before any records. */
  averageMonthlySpendPence: number | null;
}

/**
 * Totals for a whole range, built by adding up its months, so a range total
 * always equals the sum of the months shown in the charts.
 */
export function summariseRange(totals: readonly MonthTotals[]): RangeSummary {
  const incomePence = totals.reduce((sum, t) => sum + t.incomePence, 0);
  const expensesPence = totals.reduce((sum, t) => sum + t.expensesPence, 0);
  // Average only over months since tracking began, like the trend line.
  const trackedMonths = trendSeries(totals).filter((p) => p.expensesPence !== null).length;
  return {
    incomePence,
    expensesPence,
    netPence: incomePence - expensesPence,
    trackedMonths,
    averageMonthlySpendPence:
      trackedMonths === 0 ? null : Math.round(expensesPence / trackedMonths),
  };
}

/** A trend needs at least two months with spending; one point is not a trend. */
export function hasEnoughTrendData(totals: readonly MonthTotals[]): boolean {
  return totals.filter((t) => t.expensesPence > 0).length >= 2;
}

/* ---------- Text summaries: the same figures as the charts, in words ---------- */

export function incomeExpenseSummary(totals: readonly MonthTotals[]): string {
  const income = totals.reduce((sum, t) => sum + t.incomePence, 0);
  const spent = totals.reduce((sum, t) => sum + t.expensesPence, 0);
  const net = income - spent;
  const months = totals.map((t) => t.month);
  const outcome =
    net >= 0 ? `leaving ${formatPence(net)} more coming in` : `${formatPence(-net)} more going out`;
  return `${rangeLabel(months)}: ${formatPence(income)} in and ${formatPence(spent)} out, ${outcome}.`;
}

export function spendingTrendSummary(totals: readonly MonthTotals[]): string {
  const withSpending = totals.filter((t) => t.expensesPence > 0);
  const highest = withSpending.reduce<MonthTotals | undefined>(
    (max, t) => (!max || t.expensesPence > max.expensesPence ? t : max),
    undefined,
  );
  const lowest = withSpending.reduce<MonthTotals | undefined>(
    (min, t) => (!min || t.expensesPence < min.expensesPence ? t : min),
    undefined,
  );
  if (!highest || !lowest) return 'No spending recorded in this period.';
  const average = Math.round(
    withSpending.reduce((sum, t) => sum + t.expensesPence, 0) / withSpending.length,
  );
  return `Highest spending: ${formatMonthLabel(highest.month)} (${formatPence(highest.expensesPence)}). Lowest: ${formatMonthLabel(lowest.month)} (${formatPence(lowest.expensesPence)}). Average across months with spending: ${formatPence(average)}.`;
}

export function categorySummary(
  breakdown: ReturnType<typeof categoryBreakdown>,
  months: readonly MonthKey[],
): string {
  const [top] = breakdown.categories;
  if (!top) return 'No spending recorded in this period.';
  const count = breakdown.categories.length;
  return `${formatPence(breakdown.totalPence)} spent across ${String(count)} ${count === 1 ? 'category' : 'categories'} in ${rangeLabel(months)}. The largest was ${top.label} at ${formatPence(top.totalPence)} (${String(top.sharePercent)}%).`;
}
