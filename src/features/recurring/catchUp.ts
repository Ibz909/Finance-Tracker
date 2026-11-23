import { addDays } from 'date-fns';
import type { RecurringSchedule } from '../../models/recurring';
import type { Transaction } from '../../models/transaction';
import type { IsoDate } from '../../utils/dates';
import { parseIsoDate, toIsoDate } from '../../utils/dates';
import { dueDatesBetween, firstOccurrenceOnOrAfter } from './schedule';

/**
 * The ID of the transaction created for a schedule's payment on a date.
 * Being predictable means the same payment can never be added twice.
 */
export function recurringTransactionId(scheduleId: string, date: IsoDate): string {
  return `rec-${scheduleId}-${date}`;
}

export function dayAfter(date: IsoDate): IsoDate {
  return toIsoDate(addDays(parseIsoDate(date), 1));
}

/**
 * Adds every payment of one schedule that has fallen due up to and
 * including `today`, and moves `nextDueDate` past today.
 *
 * Pure: `today` and `now` (for timestamps) are passed in. Payments whose
 * transaction already exists (`existingIds`) are skipped, as a second
 * guard against duplicates.
 */
export function catchUpSchedule(
  schedule: RecurringSchedule,
  { today, now, existingIds }: { today: IsoDate; now: string; existingIds: ReadonlySet<string> },
): { schedule: RecurringSchedule; transactions: Transaction[] } {
  const { nextDueDate } = schedule;
  if (schedule.paused || nextDueDate === null || nextDueDate > today) {
    return { schedule, transactions: [] };
  }

  const dates = dueDatesBetween(
    schedule.startDate,
    schedule.frequency,
    nextDueDate,
    today,
    schedule.endDate,
  );
  const transactions = dates
    .map((date) => toTransaction(schedule, date, now))
    .filter((t) => !existingIds.has(t.id));

  return {
    schedule: {
      ...schedule,
      nextDueDate: firstOccurrenceOnOrAfter(
        schedule.startDate,
        schedule.frequency,
        dayAfter(today),
        schedule.endDate,
      ),
    },
    transactions,
  };
}

/** Catches up every schedule. Returns the same arrays if nothing was due. */
export function catchUpAll(
  schedules: readonly RecurringSchedule[],
  transactions: readonly Transaction[],
  { today, now }: { today: IsoDate; now: string },
): { schedules: readonly RecurringSchedule[]; transactions: readonly Transaction[] } {
  const existingIds = new Set(transactions.map((t) => t.id));
  const added: Transaction[] = [];

  const nextSchedules = schedules.map((schedule) => {
    const result = catchUpSchedule(schedule, { today, now, existingIds });
    for (const t of result.transactions) existingIds.add(t.id);
    added.push(...result.transactions);
    return result.schedule;
  });

  const changed = nextSchedules.some((schedule, i) => schedule !== schedules[i]);
  if (!changed) return { schedules, transactions };
  return { schedules: nextSchedules, transactions: [...transactions, ...added] };
}

function toTransaction(schedule: RecurringSchedule, date: IsoDate, now: string): Transaction {
  return {
    id: recurringTransactionId(schedule.id, date),
    type: schedule.type,
    amountPence: schedule.amountPence,
    categoryId: schedule.categoryId,
    description: schedule.description,
    date,
    ...(schedule.notes ? { notes: schedule.notes } : {}),
    createdAt: now,
    updatedAt: now,
    recurringScheduleId: schedule.id,
    isDemo: schedule.isDemo,
  };
}
