import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../models/transaction';
import { makeTransaction } from '../../test/fixtures';
import type { TransactionFilters } from './transactionFilters';
import {
  resolvePeriod,
  applyFilterChange,
  countActiveFilters,
  dateRangeError,
  DEFAULT_FILTERS,
  filterTransactions,
  parseFilters,
  sortTransactions,
  writeFilters,
} from './transactionFilters';

const tesco = makeTransaction({
  id: 'tesco',
  description: 'TESCO Express',
  amountPence: 1250,
  date: '2026-11-03',
  categoryId: 'food_groceries',
});
const rent = makeTransaction({
  id: 'rent',
  description: 'Rent',
  amountPence: 95000,
  date: '2026-11-01',
  categoryId: 'rent_housing',
});
const salary = makeTransaction({
  id: 'salary',
  type: 'income',
  description: 'Salary',
  amountPence: 285000,
  date: '2026-10-28',
  categoryId: 'salary',
});
const lunch = makeTransaction({
  id: 'lunch',
  description: 'Tesco meal deal',
  amountPence: 395,
  date: '2026-10-15',
  categoryId: 'restaurants_takeaways',
});
const all = [tesco, rent, salary, lunch];

function ids(list: Transaction[]) {
  return list.map((t) => t.id);
}
function filter(changes: Partial<TransactionFilters>) {
  return ids(filterTransactions(all, { ...DEFAULT_FILTERS, ...changes }));
}

describe('filterTransactions', () => {
  it('returns everything with no filters', () => {
    expect(filter({})).toEqual(['tesco', 'rent', 'salary', 'lunch']);
  });

  it('searches descriptions ignoring case and surrounding spaces', () => {
    expect(filter({ query: '  tesco ' })).toEqual(['tesco', 'lunch']);
    expect(filter({ query: 'EXPRESS' })).toEqual(['tesco']);
    expect(filter({ query: 'nothing like this' })).toEqual([]);
  });

  it('filters by type and by category', () => {
    expect(filter({ type: 'income' })).toEqual(['salary']);
    expect(filter({ type: 'expense' })).toEqual(['tesco', 'rent', 'lunch']);
    expect(filter({ categoryId: 'rent_housing' })).toEqual(['rent']);
  });

  it('treats date bounds as inclusive', () => {
    expect(filter({ from: '2026-11-01' })).toEqual(['tesco', 'rent']);
    expect(filter({ to: '2026-10-28' })).toEqual(['salary', 'lunch']);
    expect(filter({ from: '2026-10-28', to: '2026-11-01' })).toEqual(['rent', 'salary']);
  });

  it('ignores an impossible date range rather than hiding everything', () => {
    expect(filter({ from: '2026-12-01', to: '2026-01-01' })).toHaveLength(4);
  });

  it('combines every filter', () => {
    expect(filter({ query: 'tesco', type: 'expense', from: '2026-11-01' })).toEqual(['tesco']);
    expect(
      filter({ query: 'tesco', categoryId: 'restaurants_takeaways', to: '2026-10-31' }),
    ).toEqual(['lunch']);
    expect(filter({ query: 'rent', type: 'income' })).toEqual([]);
  });
});

describe('sortTransactions', () => {
  it.each([
    ['date-desc', ['tesco', 'rent', 'salary', 'lunch']],
    ['date-asc', ['lunch', 'salary', 'rent', 'tesco']],
    ['amount-desc', ['salary', 'rent', 'tesco', 'lunch']],
    ['amount-asc', ['lunch', 'tesco', 'rent', 'salary']],
  ] as const)('%s', (sort, expected) => {
    expect(ids(sortTransactions(all, sort))).toEqual(expected);
  });

  it('breaks amount ties by newest first, consistently', () => {
    const older = makeTransaction({ id: 'older', amountPence: 500, date: '2026-01-01' });
    const newer = makeTransaction({ id: 'newer', amountPence: 500, date: '2026-02-01' });
    expect(ids(sortTransactions([older, newer], 'amount-desc'))).toEqual(['newer', 'older']);
    expect(ids(sortTransactions([older, newer], 'amount-asc'))).toEqual(['newer', 'older']);
  });

  it('does not change the original list', () => {
    const input = [...all];
    sortTransactions(input, 'amount-asc');
    expect(input).toEqual(all);
  });
});

describe('dateRangeError', () => {
  it('reports a start after the end only', () => {
    expect(dateRangeError({ from: '2026-12-01', to: '2026-01-01' })).toMatch(/after the end/);
    expect(dateRangeError({ from: '2026-01-01', to: '2026-01-01' })).toBeNull();
    expect(dateRangeError({ from: '2026-01-01', to: null })).toBeNull();
  });
});

describe('countActiveFilters', () => {
  it('counts filters but not sorting or blank search', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_FILTERS, query: '   ', sort: 'amount-asc' })).toBe(0);
    expect(
      countActiveFilters({ ...DEFAULT_FILTERS, query: 'a', type: 'income', from: '2026-01-01' }),
    ).toBe(3);
  });
});

describe('applyFilterChange', () => {
  it('clears a category that does not match a newly chosen type', () => {
    const current = { ...DEFAULT_FILTERS, categoryId: 'food_groceries' };
    expect(applyFilterChange(current, { type: 'income' }).categoryId).toBeNull();
    expect(applyFilterChange(current, { type: 'expense' }).categoryId).toBe('food_groceries');
  });
});

describe('URL parameters', () => {
  it('round-trips filters, writing only what differs from the defaults', () => {
    const filters: TransactionFilters = {
      query: 'tesco',
      type: 'expense',
      categoryId: 'food_groceries',
      from: '2026-10-01',
      to: '2026-11-30',
      month: null,
      sort: 'amount-desc',
    };
    const params = writeFilters(new URLSearchParams('other=keep'), filters);

    expect(params.toString()).toBe(
      'other=keep&q=tesco&type=expense&category=food_groceries&from=2026-10-01&to=2026-11-30&sort=amount-desc',
    );
    expect(parseFilters(params)).toEqual(filters);
    expect(writeFilters(new URLSearchParams(), DEFAULT_FILTERS).toString()).toBe('');
  });

  it('ignores anything invalid instead of trusting it', () => {
    expect(
      parseFilters(
        new URLSearchParams(
          'type=refund&category=yachts&from=2026-02-30&to=tomorrow&month=2026-13&sort=random',
        ),
      ),
    ).toEqual(DEFAULT_FILTERS);
  });

  it('drops a category that contradicts the type in the URL', () => {
    expect(
      parseFilters(new URLSearchParams('type=income&category=rent_housing')).categoryId,
    ).toBeNull();
  });
});

describe('month period', () => {
  const inNovember = makeTransaction({ id: 'nov', date: '2026-11-30' });
  const inDecember = makeTransaction({ id: 'dec', date: '2026-12-01' });
  const inJanuary = makeTransaction({ id: 'jan', date: '2027-01-01' });
  const leapDay = makeTransaction({ id: 'leap', date: '2028-02-29' });
  const all = [inNovember, inDecember, inJanuary, leapDay];
  const ids = (filters: TransactionFilters) => filterTransactions(all, filters).map((t) => t.id);

  it('shows only the chosen calendar month, across year boundaries and leap days', () => {
    expect(ids({ ...DEFAULT_FILTERS, month: '2026-12' })).toEqual(['dec']);
    expect(ids({ ...DEFAULT_FILTERS, month: '2027-01' })).toEqual(['jan']);
    expect(ids({ ...DEFAULT_FILTERS, month: '2028-02' })).toEqual(['leap']);
  });

  it('shows everything for All time, and for no month at all', () => {
    expect(ids({ ...DEFAULT_FILTERS, month: 'all' })).toHaveLength(4);
    expect(ids(DEFAULT_FILTERS)).toHaveLength(4);
  });

  it('lets a custom date range take over from the month', () => {
    expect(
      ids({ ...DEFAULT_FILTERS, month: '2026-11', from: '2026-12-01', to: '2027-01-31' }),
    ).toEqual(['dec', 'jan']);
  });

  it('clears custom dates when a month or All time is picked', () => {
    const custom = { ...DEFAULT_FILTERS, from: '2026-10-01', to: '2026-10-31' };
    expect(applyFilterChange(custom, { month: '2026-11' })).toMatchObject({
      month: '2026-11',
      from: null,
      to: null,
    });
    expect(applyFilterChange(custom, { month: 'all' })).toMatchObject({ from: null, to: null });
  });

  it('resolves which period is shown, using the shared month when none is chosen', () => {
    expect(resolvePeriod(DEFAULT_FILTERS, '2026-11')).toEqual({ kind: 'month', month: '2026-11' });
    expect(resolvePeriod({ ...DEFAULT_FILTERS, month: '2026-03' }, '2026-11')).toEqual({
      kind: 'month',
      month: '2026-03',
    });
    expect(resolvePeriod({ ...DEFAULT_FILTERS, month: 'all' }, '2026-11')).toEqual({ kind: 'all' });
    expect(
      resolvePeriod({ ...DEFAULT_FILTERS, month: 'all', from: '2026-10-01' }, '2026-11'),
    ).toEqual({ kind: 'custom', from: '2026-10-01', to: null });
  });

  it('keeps the month and a custom range from the URL, letting the range win', () => {
    const params = new URLSearchParams('month=2026-11&from=2026-10-01&to=2026-10-31');
    const filters = parseFilters(params);
    expect(filters).toMatchObject({ month: '2026-11', from: '2026-10-01', to: '2026-10-31' });
    expect(resolvePeriod(filters, '2026-11').kind).toBe('custom');
  });

  it('round-trips the month and All time in the URL', () => {
    for (const month of ['2026-11', 'all'] as const) {
      const params = writeFilters(new URLSearchParams(), { ...DEFAULT_FILTERS, month });
      expect(params.toString()).toBe(`month=${month}`);
      expect(parseFilters(params).month).toBe(month);
    }
  });
});
