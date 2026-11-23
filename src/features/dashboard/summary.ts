import type { Transaction } from '../../models/transaction';
import type { MonthKey } from '../../utils/dates';
import { isDateInMonth } from '../../utils/dates';
import { sortByNewest } from '../transactions/transactionSelectors';

export interface MonthSummary {
  incomePence: number;
  expensesPence: number;
  /** Income minus expenses. Negative when more went out than came in. */
  netPence: number;
  /**
   * Net cash flow as a percentage of income, to one decimal place.
   * `null` when there was no income: the rate is undefined, not 0% or ∞.
   * This is a cash-flow estimate, not a measure of money actually saved.
   */
  savingsRate: number | null;
  transactionCount: number;
}

export function transactionsInMonth(
  transactions: readonly Transaction[],
  month: MonthKey,
): Transaction[] {
  return transactions.filter((transaction) => isDateInMonth(transaction.date, month));
}

/** Totals for one calendar month. All arithmetic is in integer pence. */
export function summariseMonth(
  transactions: readonly Transaction[],
  month: MonthKey,
): MonthSummary {
  let incomePence = 0;
  let expensesPence = 0;
  let transactionCount = 0;

  for (const transaction of transactions) {
    if (!isDateInMonth(transaction.date, month)) continue;
    transactionCount++;
    if (transaction.type === 'income') incomePence += transaction.amountPence;
    else expensesPence += transaction.amountPence;
  }

  const netPence = incomePence - expensesPence;
  return {
    incomePence,
    expensesPence,
    netPence,
    savingsRate: savingsRate(netPence, incomePence),
    transactionCount,
  };
}

export function savingsRate(netPence: number, incomePence: number): number | null {
  if (incomePence <= 0) return null;
  return Math.round((netPence / incomePence) * 1000) / 10;
}

/** The latest transactions dated within the month, newest first. */
export function recentTransactions(
  transactions: readonly Transaction[],
  month: MonthKey,
  limit = 5,
): Transaction[] {
  return sortByNewest(transactionsInMonth(transactions, month)).slice(0, limit);
}
