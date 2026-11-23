import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../models/transaction';
import { makeTransaction } from '../../test/fixtures';
import {
  categoryBreakdown,
  categorySummary,
  groupSmallCategories,
  hasEnoughTrendData,
  incomeExpenseSummary,
  monthlyTotals,
  monthsEndingAt,
  rangeLabel,
  spendingTrendSummary,
  trendSeries,
} from './analytics';

function income(amountPence: number, date: string): Transaction {
  return makeTransaction({ type: 'income', categoryId: 'salary', amountPence, date });
}
function expense(amountPence: number, date: string, categoryId = 'food_groceries'): Transaction {
  return makeTransaction({ type: 'expense', amountPence, date, categoryId });
}

describe('monthsEndingAt', () => {
  it('lists months oldest first, across a year boundary', () => {
    expect(monthsEndingAt('2026-02', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(monthsEndingAt('2026-11', 1)).toEqual(['2026-11']);
  });
});

describe('rangeLabel', () => {
  it.each([
    [['2026-06', '2026-11'], 'Jun – Nov 2026'],
    [['2025-12', '2026-05'], 'Dec 2025 – May 2026'],
    [['2026-11'], 'November 2026'],
    [[], ''],
  ])('labels %j as %j', (months, expected) => {
    expect(rangeLabel(months)).toBe(expected);
  });
});

describe('monthlyTotals', () => {
  const transactions = [
    income(250000, '2026-10-01'),
    expense(1000, '2026-10-31'), // last day of October
    expense(2000, '2026-11-01'), // first day of November
    expense(9999, '2026-09-30'), // before the range
    expense(8888, '2026-12-01'), // after the range
  ];

  it('totals each month, with zeros for months without data', () => {
    expect(monthlyTotals(transactions, ['2026-10', '2026-11'])).toEqual([
      { month: '2026-10', incomePence: 250000, expensesPence: 1000, netPence: 249000 },
      { month: '2026-11', incomePence: 0, expensesPence: 2000, netPence: -2000 },
    ]);
  });

  it('counts each transaction in exactly one month', () => {
    const months = monthsEndingAt('2026-12', 6);
    const totals = monthlyTotals(transactions, months);
    const counted = totals.reduce((sum, t) => sum + t.incomePence + t.expensesPence, 0);
    const all = transactions.reduce((sum, t) => sum + t.amountPence, 0);
    expect(counted).toBe(all);
  });
});

describe('categoryBreakdown', () => {
  const months = ['2026-10', '2026-11'];
  const transactions = [
    expense(6000, '2026-10-05', 'food_groceries'),
    expense(3000, '2026-11-05', 'food_groceries'),
    expense(3000, '2026-11-06', 'transport'),
    expense(1000, '2026-11-07', 'entertainment'),
    expense(50000, '2026-09-01', 'travel'), // outside the range
    income(100000, '2026-11-01'), // income is not spending
  ];

  it('ranks categories by spending with their share of the total', () => {
    const result = categoryBreakdown(transactions, months);

    expect(result.totalPence).toBe(13000);
    expect(result.categories).toEqual([
      {
        categoryId: 'food_groceries',
        label: 'Food & Groceries',
        color: 'chart-1',
        totalPence: 9000,
        sharePercent: 69.2,
      },
      {
        categoryId: 'transport',
        label: 'Transport',
        color: 'chart-3',
        totalPence: 3000,
        sharePercent: 23.1,
      },
      {
        categoryId: 'entertainment',
        label: 'Entertainment',
        color: 'chart-7',
        totalPence: 1000,
        sharePercent: 7.7,
      },
    ]);
  });

  it('adds up exactly to the total, with nothing double counted', () => {
    const result = categoryBreakdown(transactions, months);
    expect(result.categories.reduce((sum, c) => sum + c.totalPence, 0)).toBe(result.totalPence);
  });

  it('is empty when nothing was spent', () => {
    expect(categoryBreakdown([income(100, '2026-11-01')], months)).toEqual({
      totalPence: 0,
      categories: [],
    });
  });
});

describe('hasEnoughTrendData', () => {
  it('needs spending in at least two months', () => {
    const months = ['2026-10', '2026-11'];
    expect(hasEnoughTrendData(monthlyTotals([expense(1, '2026-11-01')], months))).toBe(false);
    expect(
      hasEnoughTrendData(
        monthlyTotals([expense(1, '2026-10-01'), expense(1, '2026-11-01')], months),
      ),
    ).toBe(true);
  });
});

describe('summaries', () => {
  const months = ['2026-10', '2026-11'];
  const transactions = [
    income(250000, '2026-10-01'),
    income(250000, '2026-11-01'),
    expense(180000, '2026-10-05'),
    expense(220000, '2026-11-05', 'travel'),
  ];
  const totals = monthlyTotals(transactions, months);

  it('describes income against spending', () => {
    expect(incomeExpenseSummary(totals)).toBe(
      'Oct – Nov 2026: £5,000.00 in and £4,000.00 out, leaving £1,000.00 more coming in.',
    );
    expect(incomeExpenseSummary(monthlyTotals([expense(500, '2026-11-01')], months))).toBe(
      'Oct – Nov 2026: £0.00 in and £5.00 out, £5.00 more going out.',
    );
  });

  it('describes the spending trend', () => {
    expect(spendingTrendSummary(totals)).toBe(
      'Highest spending: November 2026 (£2,200.00). Lowest: October 2026 (£1,800.00). Average across months with spending: £2,000.00.',
    );
    expect(spendingTrendSummary(monthlyTotals([], months))).toBe(
      'No spending recorded in this period.',
    );
  });

  it('describes the category breakdown', () => {
    expect(categorySummary(categoryBreakdown(transactions, months), months)).toBe(
      '£4,000.00 spent across 2 categories in Oct – Nov 2026. The largest was Travel at £2,200.00 (55%).',
    );
  });
});

describe('groupSmallCategories', () => {
  const categories = Array.from({ length: 8 }, (_, i) => ({
    categoryId: `c${String(i)}`,
    label: `Category ${String(i)}`,
    color: 'chart-1' as const,
    totalPence: 800 - i * 100,
    sharePercent: 10,
  }));

  it('keeps short lists as they are', () => {
    expect(groupSmallCategories(categories.slice(0, 3), 6)).toHaveLength(3);
  });

  it('merges the smallest into one slice without changing the total', () => {
    const grouped = groupSmallCategories(categories, 6);

    expect(grouped).toHaveLength(6);
    expect(grouped[5]).toMatchObject({
      label: 'Everything else (3 categories)',
      totalPence: 300 + 200 + 100,
      sharePercent: 30,
    });
    const sum = (list: { totalPence: number }[]) => list.reduce((s, c) => s + c.totalPence, 0);
    expect(sum(grouped)).toBe(sum(categories));
  });
});

describe('trendSeries', () => {
  it('leaves months before the first record as gaps, but keeps later zeros', () => {
    const months = ['2026-07', '2026-08', '2026-09', '2026-10'];
    const totals = monthlyTotals(
      [income(1000, '2026-08-01'), expense(500, '2026-08-02'), expense(700, '2026-10-02')],
      months,
    );

    expect(trendSeries(totals)).toEqual([
      { month: '2026-07', expensesPence: null }, // before tracking began
      { month: '2026-08', expensesPence: 500 },
      { month: '2026-09', expensesPence: 0 }, // tracked, genuinely nothing spent
      { month: '2026-10', expensesPence: 700 },
    ]);
  });
});
