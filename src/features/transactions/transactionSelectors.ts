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

/** Money in and money out across a list, in pence. */
export function totalsOf(transactions: readonly Transaction[]): {
  inPence: number;
  outPence: number;
} {
  let inPence = 0;
  let outPence = 0;
  for (const t of transactions) {
    if (t.type === 'income') inPence += t.amountPence;
    else outPence += t.amountPence;
  }
  return { inPence, outPence };
}

/**
 * Runs of transactions sharing a date, in the list's existing order. Meant
 * for a list already sorted by date; it never reorders anything.
 */
export function groupByDate(
  transactions: readonly Transaction[],
): { date: Transaction['date']; transactions: Transaction[] }[] {
  const groups: { date: Transaction['date']; transactions: Transaction[] }[] = [];
  for (const t of transactions) {
    const last = groups.at(-1);
    if (last?.date === t.date) last.transactions.push(t);
    else groups.push({ date: t.date, transactions: [t] });
  }
  return groups;
}

/** The figures for a list of transactions: money in, money out, the net and the count. */
export function summarise(transactions: readonly Transaction[]): {
  inPence: number;
  outPence: number;
  netPence: number;
  count: number;
} {
  const { inPence, outPence } = totalsOf(transactions);
  return { inPence, outPence, netPence: inPence - outPence, count: transactions.length };
}
