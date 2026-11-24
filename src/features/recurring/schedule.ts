import { addMonths, addWeeks, addYears } from 'date-fns';
import type { Frequency } from '../../models/recurring';
import type { IsoDate } from '../../utils/dates';
import { parseIsoDate, toIsoDate } from '../../utils/dates';

/**
 * A safety limit on how many dates one call can return or step through,
 * so damaged data (say, a start date centuries ago) can never hang the app
 * or flood it with transactions. Weekly payments for 10 years is about 520.
 */
export const MAX_OCCURRENCES = 1000;

/**
 * The nth payment date of a schedule; n = 0 is the start date.
 *
 * Every date is worked out from the *start date*, never from the previous
 * payment. That matters for month ends: a schedule starting 31 January
 * gives 28 February, then 31 March. Stepping from the previous date would
 * give 28 February, then 28 March, and stay on the 28th for ever.
 *
 * date-fns does the clamping: adding one month to 31 January has no
 * 31 February to land on, so it returns the last day of February. The same
 * applies to 29 February on a yearly schedule in a non-leap year.
 */
export function nthOccurrence(start: IsoDate, frequency: Frequency, n: number): IsoDate {
  const date = parseIsoDate(start);
  switch (frequency) {
    case 'weekly':
      return toIsoDate(addWeeks(date, n));
    case 'fortnightly':
      return toIsoDate(addWeeks(date, n * 2));
    case 'monthly':
      return toIsoDate(addMonths(date, n));
    case 'yearly':
      return toIsoDate(addYears(date, n));
  }
}

/**
 * Every payment date from `from` to `through`, both included, that is also
 * on or before `endDate` (if given). Returns at most MAX_OCCURRENCES dates.
 *
 * ISO dates compare correctly as strings, so no Date objects are needed
 * for the comparisons.
 */
export function dueDatesBetween(
  start: IsoDate,
  frequency: Frequency,
  from: IsoDate,
  through: IsoDate,
  endDate?: IsoDate,
): IsoDate[] {
  const last = endDate !== undefined && endDate < through ? endDate : through;
  const dates: IsoDate[] = [];
  for (let n = 0; n < MAX_OCCURRENCES && dates.length < MAX_OCCURRENCES; n++) {
    const date = nthOccurrence(start, frequency, n);
    if (date > last) break;
    if (date >= from) dates.push(date);
  }
  return dates;
}

/**
 * The first payment date on or after `date`, or null if the schedule ends
 * before then (or the date is beyond the safety limit).
 */
export function firstOccurrenceOnOrAfter(
  start: IsoDate,
  frequency: Frequency,
  date: IsoDate,
  endDate?: IsoDate,
): IsoDate | null {
  for (let n = 0; n < MAX_OCCURRENCES; n++) {
    const candidate = nthOccurrence(start, frequency, n);
    if (endDate !== undefined && candidate > endDate) return null;
    if (candidate >= date) return candidate;
  }
  return null;
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  fortnightly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};
