import type { RecurringSchedule } from '../../models/recurring';
import type { Transaction } from '../../models/transaction';
import type { IsoDate, MonthKey } from '../../utils/dates';
import { addDaysToIsoDate, getMonthBounds } from '../../utils/dates';
import { dueDatesBetween } from './schedule';

/**
 * One recurring payment on a date: either already added to the history
 * ("paid", taken from the real transactions) or still to come ("due",
 * projected from an active schedule). Past dates only ever show what really
 * happened, so a payment a pause skipped never appears as paid.
 */
export interface RecurringPayment {
  key: string;
  scheduleId: string | null;
  description: string;
  categoryId: string;
  type: 'income' | 'expense';
  amountPence: number;
  date: IsoDate;
  status: 'paid' | 'due';
  isDemo: boolean;
}

const byDateThenName = (a: RecurringPayment, b: RecurringPayment) =>
  a.date.localeCompare(b.date) || a.description.localeCompare(b.description);

/** Recurring transactions already in the history, dated from `from` to `through`. */
export function paidPayments(
  transactions: readonly Transaction[],
  from: IsoDate,
  through: IsoDate,
): RecurringPayment[] {
  return transactions
    .filter((t) => t.recurringScheduleId !== undefined && t.date >= from && t.date <= through)
    .map((t) => ({
      key: `paid-${t.id}`,
      scheduleId: t.recurringScheduleId ?? null,
      description: t.description,
      categoryId: t.categoryId,
      type: t.type,
      amountPence: t.amountPence,
      date: t.date,
      status: 'paid' as const,
      isDemo: t.isDemo,
    }));
}

/**
 * Payments still to come from `from` to `through`: active schedules only,
 * starting at each one's next due date and stopping at its end date.
 */
export function duePayments(
  schedules: readonly RecurringSchedule[],
  from: IsoDate,
  through: IsoDate,
): RecurringPayment[] {
  const payments: RecurringPayment[] = [];
  for (const s of schedules) {
    if (s.paused || s.nextDueDate === null) continue;
    const start = s.nextDueDate > from ? s.nextDueDate : from;
    for (const date of dueDatesBetween(s.startDate, s.frequency, start, through, s.endDate)) {
      payments.push({
        key: `due-${s.id}-${date}`,
        scheduleId: s.id,
        description: s.description,
        categoryId: s.categoryId,
        type: s.type,
        amountPence: s.amountPence,
        date,
        status: 'due',
        isDemo: s.isDemo,
      });
    }
  }
  return payments;
}

/** Everything recurring in a calendar month: what was paid plus what is still due. */
export function monthPayments(
  schedules: readonly RecurringSchedule[],
  transactions: readonly Transaction[],
  month: MonthKey,
): RecurringPayment[] {
  const { start, end } = getMonthBounds(month);
  return [...paidPayments(transactions, start, end), ...duePayments(schedules, start, end)].sort(
    byDateThenName,
  );
}

/** The next `count` payments from today on, across every active schedule. */
export function upcomingPayments(
  schedules: readonly RecurringSchedule[],
  today: IsoDate,
  count = 5,
): RecurringPayment[] {
  // A year ahead is enough to find the next few of even a yearly schedule.
  return duePayments(schedules, today, addDaysToIsoDate(today, 366))
    .sort(byDateThenName)
    .slice(0, count);
}

/** Money in, money out and the net across a set of payments, in pence. */
export function paymentTotals(payments: readonly RecurringPayment[]): {
  inPence: number;
  outPence: number;
  netPence: number;
} {
  let inPence = 0;
  let outPence = 0;
  for (const p of payments) {
    if (p.type === 'income') inPence += p.amountPence;
    else outPence += p.amountPence;
  }
  return { inPence, outPence, netPence: inPence - outPence };
}

/** Payments grouped by date, for the calendar. */
export function paymentsByDate(
  payments: readonly RecurringPayment[],
): Map<IsoDate, RecurringPayment[]> {
  const days = new Map<IsoDate, RecurringPayment[]>();
  for (const p of payments) {
    const list = days.get(p.date);
    if (list) list.push(p);
    else days.set(p.date, [p]);
  }
  return days;
}
