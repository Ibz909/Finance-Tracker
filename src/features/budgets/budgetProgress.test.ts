import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../models/transaction';
import { makeBudget, makeTransaction } from '../../test/fixtures';
import {
  getBudgetProgress,
  getBudgetStatus,
  getMonthBudgets,
  spentInMonth,
} from './budgetProgress';

function expense(amountPence: number, date: string, categoryId = 'food_groceries'): Transaction {
  return makeTransaction({ type: 'expense', amountPence, date, categoryId });
}

describe('getBudgetStatus', () => {
  // Limit £100.00 = 10000 pence.
  it.each([
    [0, 'normal'],
    [7499, 'normal'], // 74.99%
    [7500, 'warning'], // exactly 75%
    [9999, 'warning'], // 99.99%
    [10000, 'exceeded'], // exactly 100%
    [25000, 'exceeded'],
  ] as const)('%i pence of a £100 limit is %s', (spent, expected) => {
    expect(getBudgetStatus(spent, 10000)).toBe(expected);
  });

  it('is exact where floating-point percentages would not be', () => {
    // 0.75 * 33 = 24.75 → spending 2475 of 3300 is exactly 75%.
    expect(getBudgetStatus(2475, 3300)).toBe('warning');
    expect(getBudgetStatus(2474, 3300)).toBe('normal');
  });
});

describe('spentInMonth', () => {
  const transactions = [
    expense(1000, '2026-11-01'),
    expense(2000, '2026-11-30', 'transport'),
    expense(9999, '2026-10-31'), // other month
    makeTransaction({
      type: 'income',
      categoryId: 'refunds',
      amountPence: 500,
      date: '2026-11-05',
    }),
  ];

  it('counts every expense in the month, never income or other months', () => {
    expect(spentInMonth(transactions, '2026-11')).toBe(3000);
  });

  it('can be limited to one category', () => {
    expect(spentInMonth(transactions, '2026-11', 'food_groceries')).toBe(1000);
    expect(spentInMonth(transactions, '2026-11', 'travel')).toBe(0);
  });
});

describe('getBudgetProgress', () => {
  it('reports spent, remaining, percentage and status', () => {
    const budget = makeBudget({ limitPence: 30000 });
    const progress = getBudgetProgress(
      budget,
      [expense(12000, '2026-11-03'), expense(11000, '2026-11-20')],
      '2026-11',
    );
    expect(progress).toEqual({
      budget,
      spentPence: 23000,
      remainingPence: 7000,
      percentUsed: 76, // 76.66… rounded down
      status: 'warning',
    });
  });

  it('shows overspending as a negative remainder and more than 100%', () => {
    const progress = getBudgetProgress(
      makeBudget({ limitPence: 10000 }),
      [expense(11250, '2026-11-03')],
      '2026-11',
    );
    expect(progress).toMatchObject({ remainingPence: -1250, percentUsed: 112, status: 'exceeded' });
  });

  it('never reads 100% while still under the limit', () => {
    const progress = getBudgetProgress(
      makeBudget({ limitPence: 10000 }),
      [expense(9999, '2026-11-03')],
      '2026-11',
    );
    expect(progress).toMatchObject({ percentUsed: 99, status: 'warning' });
  });

  it('handles a month with no spending', () => {
    expect(getBudgetProgress(makeBudget(), [], '2026-11')).toMatchObject({
      spentPence: 0,
      percentUsed: 0,
      status: 'normal',
    });
  });
});

describe('getMonthBudgets', () => {
  it('keeps the overall budget separate and orders category budgets consistently', () => {
    const overall = makeBudget({ scope: 'overall', limitPence: 200000 });
    const transport = makeBudget({ categoryId: 'transport', limitPence: 8000 });
    const groceries = makeBudget({ categoryId: 'food_groceries', limitPence: 30000 });
    const transactions = [expense(5000, '2026-11-02'), expense(3000, '2026-11-03', 'transport')];

    const result = getMonthBudgets([transport, overall, groceries], transactions, '2026-11');

    // Overall counts all spending, not the sum of category limits.
    expect(result.overall).toMatchObject({ spentPence: 8000, remainingPence: 192000 });
    expect(result.categories.map((p) => p.budget.categoryId)).toEqual([
      'food_groceries',
      'transport',
    ]);
  });

  it('has no overall budget when none is set', () => {
    expect(getMonthBudgets([makeBudget()], [], '2026-11').overall).toBeUndefined();
  });
});
