import { BUDGET_EXCEEDED_PERCENT, BUDGET_WARNING_PERCENT } from '../../constants/budgets';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import type { Budget } from '../../models/budget';
import type { Transaction } from '../../models/transaction';
import type { MonthKey } from '../../utils/dates';
import { isDateInMonth } from '../../utils/dates';

export type BudgetStatus = 'normal' | 'warning' | 'exceeded';

export interface BudgetProgress {
  budget: Budget;
  spentPence: number;
  /** Limit minus spending. Negative means over budget by that amount. */
  remainingPence: number;
  /** Whole percent of the limit used, rounded down; can exceed 100. */
  percentUsed: number;
  status: BudgetStatus;
}

/**
 * Status from spending against a limit. Compares in integers
 * (spent × 100 ≥ limit × threshold) so exactly 75% or 100% is never
 * misjudged by floating-point rounding.
 */
export function getBudgetStatus(spentPence: number, limitPence: number): BudgetStatus {
  if (spentPence * 100 >= limitPence * BUDGET_EXCEEDED_PERCENT) return 'exceeded';
  if (spentPence * 100 >= limitPence * BUDGET_WARNING_PERCENT) return 'warning';
  return 'normal';
}

/**
 * Expense spending in a calendar month: all categories, or just one.
 * Income never counts towards a budget.
 */
export function spentInMonth(
  transactions: readonly Transaction[],
  month: MonthKey,
  categoryId?: string,
): number {
  let total = 0;
  for (const t of transactions) {
    if (t.type !== 'expense' || !isDateInMonth(t.date, month)) continue;
    if (categoryId !== undefined && t.categoryId !== categoryId) continue;
    total += t.amountPence;
  }
  return total;
}

export function getBudgetProgress(
  budget: Budget,
  transactions: readonly Transaction[],
  month: MonthKey,
): BudgetProgress {
  const spentPence = spentInMonth(
    transactions,
    month,
    budget.scope === 'category' ? budget.categoryId : undefined,
  );
  return {
    budget,
    spentPence,
    remainingPence: budget.limitPence - spentPence,
    // Rounded down, so the figure never reads "100%" while still under the limit.
    percentUsed: Math.floor((spentPence * 100) / budget.limitPence),
    status: getBudgetStatus(spentPence, budget.limitPence),
  };
}

const CATEGORY_ORDER = new Map<string, number>(DEFAULT_CATEGORIES.map((c, i) => [c.id, i]));

/**
 * Progress for every budget in a month. The overall budget is kept apart:
 * it is a separate limit, never the sum of the category budgets.
 */
export function getMonthBudgets(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  month: MonthKey,
): { overall: BudgetProgress | undefined; categories: BudgetProgress[] } {
  const overallBudget = budgets.find((b) => b.scope === 'overall');
  const categories = budgets
    .filter((b) => b.scope === 'category')
    .sort(
      (a, b) =>
        (CATEGORY_ORDER.get(a.categoryId ?? '') ?? 99) -
        (CATEGORY_ORDER.get(b.categoryId ?? '') ?? 99),
    )
    .map((b) => getBudgetProgress(b, transactions, month));

  return {
    overall: overallBudget && getBudgetProgress(overallBudget, transactions, month),
    categories,
  };
}
