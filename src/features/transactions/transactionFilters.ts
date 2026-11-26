import { getCategory } from '../../constants/categories';
import type { Transaction } from '../../models/transaction';
import type { IsoDate, MonthKey } from '../../utils/dates';
import { isDateInMonth, isDateInRange, isValidIsoDate, isValidMonthKey } from '../../utils/dates';
import { sortByNewest } from './transactionSelectors';

export const TYPE_FILTERS = ['all', 'income', 'expense'] as const;
export type TypeFilter = (typeof TYPE_FILTERS)[number];

export const TRANSACTION_SORTS = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc'] as const;
export type TransactionSort = (typeof TRANSACTION_SORTS)[number];

export const SORT_LABELS: Record<TransactionSort, string> = {
  'date-desc': 'Newest first',
  'date-asc': 'Oldest first',
  'amount-desc': 'Amount: high to low',
  'amount-asc': 'Amount: low to high',
};

export interface TransactionFilters {
  /** Free-text search on the description, as typed. */
  query: string;
  type: TypeFilter;
  categoryId: string | null;
  /** Inclusive calendar-date bounds. */
  from: IsoDate | null;
  to: IsoDate | null;
  /**
   * The period shown: one calendar month, or everything. `null` means "the
   * shared reporting month", resolved by the page. A custom from/to range
   * takes precedence over it.
   */
  /** A month key, or "all" for All time. */
  month: MonthKey | null;
  sort: TransactionSort;
}

export const DEFAULT_FILTERS: TransactionFilters = {
  query: '',
  type: 'all',
  categoryId: null,
  from: null,
  to: null,
  month: null,
  sort: 'date-desc',
};

/** What the list covers: a month, everything, or the custom dates from the Filters panel. */
export type Period =
  | { kind: 'month'; month: MonthKey }
  | { kind: 'all' }
  | { kind: 'custom'; from: IsoDate | null; to: IsoDate | null };

export function resolvePeriod(filters: TransactionFilters, fallbackMonth: MonthKey): Period {
  if (filters.from || filters.to) return { kind: 'custom', from: filters.from, to: filters.to };
  if (filters.month === 'all') return { kind: 'all' };
  return { kind: 'month', month: filters.month ?? fallbackMonth };
}

/* ---------- Predicates: a transaction is shown only if every one passes ---------- */

const normalise = (text: string) => text.trim().toLocaleLowerCase('en-GB');

type Predicate = (t: Transaction) => boolean;

function predicatesFor(filters: TransactionFilters): Predicate[] {
  const predicates: Predicate[] = [];
  const query = normalise(filters.query);
  if (query) predicates.push((t) => normalise(t.description).includes(query));
  if (filters.type !== 'all') predicates.push((t) => t.type === filters.type);
  if (filters.categoryId) predicates.push((t) => t.categoryId === filters.categoryId);
  // A month applies only when no custom range is set.
  const { month } = filters;
  if (!filters.from && !filters.to && month !== null && month !== 'all') {
    predicates.push((t) => isDateInMonth(t.date, month));
  }
  // An impossible range (from after to) is reported to the user and ignored.
  if (!dateRangeError(filters)) {
    const { from, to } = filters;
    if (from && to) predicates.push((t) => isDateInRange(t.date, from, to));
    else if (from) predicates.push((t) => t.date >= from);
    else if (to) predicates.push((t) => t.date <= to);
  }
  return predicates;
}

export function filterTransactions(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const predicates = predicatesFor(filters);
  return transactions.filter((t) => predicates.every((matches) => matches(t)));
}

/** Sorts a copy. Ties fall back to newest-first, so the order never jumps around. */
export function sortTransactions(
  transactions: readonly Transaction[],
  sort: TransactionSort,
): Transaction[] {
  const newestFirst = sortByNewest(transactions);
  switch (sort) {
    case 'date-desc':
      return newestFirst;
    case 'date-asc':
      return newestFirst.reverse();
    case 'amount-desc':
      // Array.prototype.sort is stable, so equal amounts keep newest-first order.
      return newestFirst.sort((a, b) => b.amountPence - a.amountPence);
    case 'amount-asc':
      return newestFirst.sort((a, b) => a.amountPence - b.amountPence);
  }
}

export function dateRangeError(filters: Pick<TransactionFilters, 'from' | 'to'>): string | null {
  return filters.from && filters.to && filters.from > filters.to
    ? 'The start date is after the end date'
    : null;
}

/** How many filters are narrowing the list (sorting isn't a filter). */
export function countActiveFilters(filters: TransactionFilters): number {
  return [
    normalise(filters.query) !== '',
    filters.type !== 'all',
    filters.categoryId !== null,
    filters.from !== null,
    filters.to !== null,
  ].filter(Boolean).length;
}

/**
 * Applies a change, keeping the filters consistent: picking a type clears
 * a category of the other type (a salary is never an expense), and picking
 * a month or "All time" clears a custom date range, so the two never compete.
 */
export function applyFilterChange(
  current: TransactionFilters,
  changes: Partial<TransactionFilters>,
): TransactionFilters {
  const next = { ...current, ...changes };
  if ('month' in changes) {
    next.from = null;
    next.to = null;
  }
  if (next.categoryId && next.type !== 'all' && getCategory(next.categoryId)?.type !== next.type) {
    next.categoryId = null;
  }
  return next;
}

/* ---------- URL: every value is validated; anything unknown is ignored ---------- */

const PARAM = {
  query: 'q',
  type: 'type',
  category: 'category',
  from: 'from',
  to: 'to',
  month: 'month',
  sort: 'sort',
};

function oneOf<T extends string>(options: readonly T[], value: string | null): T | null {
  return options.find((option) => option === value) ?? null;
}

export function parseFilters(params: URLSearchParams): TransactionFilters {
  const type = oneOf(TYPE_FILTERS, params.get(PARAM.type)) ?? 'all';
  const category = params.get(PARAM.category);
  const from = params.get(PARAM.from);
  const to = params.get(PARAM.to);
  const month = params.get(PARAM.month);

  const filters = applyFilterChange(DEFAULT_FILTERS, {
    query: params.get(PARAM.query) ?? '',
    type,
    categoryId: category && getCategory(category) ? category : null,
    from: from && isValidIsoDate(from) ? from : null,
    to: to && isValidIsoDate(to) ? to : null,
    sort: oneOf(TRANSACTION_SORTS, params.get(PARAM.sort)) ?? DEFAULT_FILTERS.sort,
  });
  // Set directly, not as a change: changing the month clears custom dates,
  // but reading a URL that has both must keep them (the range wins).
  return {
    ...filters,
    month: month === 'all' || (month && isValidMonthKey(month)) ? month : null,
  };
}

/** Writes only non-default values, keeping URLs short; other parameters are preserved. */
export function writeFilters(
  params: URLSearchParams,
  filters: TransactionFilters,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (key: string, value: string | null, isDefault: boolean) => {
    if (value === null || isDefault) next.delete(key);
    else next.set(key, value);
  };
  set(PARAM.query, filters.query, filters.query === '');
  set(PARAM.type, filters.type, filters.type === 'all');
  set(PARAM.category, filters.categoryId, false);
  set(PARAM.from, filters.from, false);
  set(PARAM.to, filters.to, false);
  set(PARAM.month, filters.month, false);
  set(PARAM.sort, filters.sort, filters.sort === DEFAULT_FILTERS.sort);
  return next;
}
