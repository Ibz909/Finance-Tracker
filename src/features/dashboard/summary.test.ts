import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../models/transaction';
import { makeTransaction } from '../../test/fixtures';
import { recentTransactions, savingsRate, summariseMonth } from './summary';

function income(amountPence: number, date: string, extra: Partial<Transaction> = {}) {
  return makeTransaction({ type: 'income', categoryId: 'salary', amountPence, date, ...extra });
}
function expense(amountPence: number, date: string, extra: Partial<Transaction> = {}) {
  return makeTransaction({
    type: 'expense',
    categoryId: 'food_groceries',
    amountPence,
    date,
    ...extra,
  });
}

describe('summariseMonth', () => {
  const transactions = [
    income(250000, '2026-11-28'),
    income(15050, '2026-11-01'), // first day of the month
    expense(95000, '2026-11-02'),
    expense(4599, '2026-11-30'), // last day of the month
    expense(1000, '2026-10-31'), // previous month: excluded
    income(99999, '2026-12-01'), // next month: excluded
  ];

  it('totals income and expenses within the calendar month only', () => {
    expect(summariseMonth(transactions, '2026-11')).toEqual({
      incomePence: 265050,
      expensesPence: 99599,
      netPence: 165451,
      savingsRate: 62.4, // 165451 / 265050 = 62.42…%
      transactionCount: 4,
    });
  });

  it('counts each transaction exactly once across neighbouring months', () => {
    const months = ['2026-10', '2026-11', '2026-12'].map((m) => summariseMonth(transactions, m));
    expect(months.reduce((sum, m) => sum + m.transactionCount, 0)).toBe(transactions.length);
  });

  it('returns zeros and no savings rate for an empty month', () => {
    expect(summariseMonth(transactions, '2025-01')).toEqual({
      incomePence: 0,
      expensesPence: 0,
      netPence: 0,
      savingsRate: null,
      transactionCount: 0,
    });
  });

  it('handles a month with spending but no income without NaN or Infinity', () => {
    const summary = summariseMonth([expense(5000, '2026-03-10')], '2026-03');
    expect(summary).toMatchObject({ netPence: -5000, savingsRate: null });
  });

  it('includes 29 February in a leap year', () => {
    const summary = summariseMonth([expense(700, '2024-02-29')], '2024-02');
    expect(summary.expensesPence).toBe(700);
  });

  it('includes demo and real transactions alike', () => {
    const summary = summariseMonth(
      [expense(100, '2026-05-01', { isDemo: true }), expense(200, '2026-05-02')],
      '2026-05',
    );
    expect(summary.expensesPence).toBe(300);
  });

  it('stays exact where floating-point pounds would drift', () => {
    // 0.1 + 0.2 in pounds is 0.30000000000000004; in pence it is exactly 30.
    const summary = summariseMonth(
      [expense(10, '2026-05-01'), expense(20, '2026-05-02')],
      '2026-05',
    );
    expect(summary.expensesPence).toBe(30);
  });
});

describe('savingsRate', () => {
  it.each([
    [500, 1000, 50],
    [0, 1000, 0],
    [-250, 1000, -25], // spent more than earned
    [1, 3, 33.3],
    [2, 3, 66.7],
  ])('net %i of income %i is %d%%', (net, incomeTotal, expected) => {
    expect(savingsRate(net, incomeTotal)).toBe(expected);
  });

  it('is undefined (null) without income', () => {
    expect(savingsRate(-500, 0)).toBeNull();
  });
});

describe('recentTransactions', () => {
  it('returns the newest transactions in the month, up to the limit', () => {
    const list = [
      expense(1, '2026-11-01', { id: 'a' }),
      expense(1, '2026-11-20', { id: 'b' }),
      expense(1, '2026-12-01', { id: 'next-month' }),
      expense(1, '2026-11-10', { id: 'c' }),
    ];
    expect(recentTransactions(list, '2026-11', 2).map((t) => t.id)).toEqual(['b', 'c']);
  });
});
