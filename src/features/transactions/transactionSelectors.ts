import type { Transaction } from '../../models/transaction';

/**
 * Newest first: by transaction date, then by when it was entered, then by
 * ID so the order is always stable. Returns a new array.
 */
export function sortByNewest(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.createdAt.localeCompare(a.createdAt) ||
      a.id.localeCompare(b.id),
  );
}
