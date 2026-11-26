import { differenceInCalendarDays } from 'date-fns';
import type { IsoDate, MonthKey } from '../../utils/dates';
import { getMonthBounds, parseIsoDate, toMonthKey } from '../../utils/dates';

/** Where a budget month sits relative to today. */
export type MonthTiming =
  | { kind: 'past' }
  /** Days left including today: on the last day of the month this is 1. */
  | { kind: 'current'; daysRemaining: number }
  | { kind: 'future'; daysInMonth: number };

export function monthTiming(month: MonthKey, today: IsoDate): MonthTiming {
  const { start, end } = getMonthBounds(month);
  const todayMonth = toMonthKey(today);
  const daysInMonth = differenceInCalendarDays(parseIsoDate(end), parseIsoDate(start)) + 1;
  if (month < todayMonth) return { kind: 'past' };
  if (month > todayMonth) return { kind: 'future', daysInMonth };
  return {
    kind: 'current',
    daysRemaining: differenceInCalendarDays(parseIsoDate(end), parseIsoDate(today)) + 1,
  };
}

/**
 * How much can be spent per day for the rest of the month and still stay
 * within the limit, in pence. Rounded *down* to the penny, so spending it
 * every day never goes over: £67.02 over 4 days is £16.75, not £16.76.
 * `null` when the month is over or nothing is left to spend.
 */
export function dailyAllowancePence(remainingPence: number, timing: MonthTiming): number | null {
  if (timing.kind === 'past' || remainingPence <= 0) return null;
  const days = timing.kind === 'current' ? timing.daysRemaining : timing.daysInMonth;
  return Math.floor(remainingPence / days);
}
