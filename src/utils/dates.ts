import { addDays, addMonths, endOfMonth, format, isValid, parse } from 'date-fns';

/**
 * Calendar dates are stored as `YYYY-MM-DD` strings and reporting months as
 * `YYYY-MM`. Neither carries a time or timezone, so a transaction dated
 * 1 March is 1 March everywhere.
 *
 * Never use `new Date('2026-03-01')`: the spec parses date-only strings as
 * UTC midnight, which is still 28 February in the Americas. We always parse
 * with date-fns into *local* time instead.
 *
 * Because the formats are zero-padded and big-endian, plain string
 * comparison (`a < b`) orders them correctly.
 */
export type IsoDate = string;
export type MonthKey = string;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

/** True only for real calendar dates: rejects "2026-02-30" and "2026-13-01". */
export function isValidIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(date) && format(date, 'yyyy-MM-dd') === value;
}

export function isValidMonthKey(value: string): value is MonthKey {
  return MONTH_KEY_PATTERN.test(value) && isValidIsoDate(`${value}-01`);
}

/** Local-midnight Date for a calendar date. Throws on invalid input. */
export function parseIsoDate(value: IsoDate): Date {
  if (!isValidIsoDate(value)) throw new RangeError(`Invalid ISO date: ${String(value)}`);
  return parse(value, 'yyyy-MM-dd', new Date());
}

/** The local calendar date of a Date (not its UTC date). */
export function toIsoDate(date: Date): IsoDate {
  return format(date, 'yyyy-MM-dd');
}

export function todayIsoDate(now: Date = new Date()): IsoDate {
  return toIsoDate(now);
}

export function toMonthKey(date: IsoDate): MonthKey {
  return date.slice(0, 7);
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return format(now, 'yyyy-MM');
}

/** First and last calendar date of a month, inclusive. */
export function getMonthBounds(month: MonthKey): { start: IsoDate; end: IsoDate } {
  const start = `${month}-01`;
  return { start, end: toIsoDate(endOfMonth(parseIsoDate(start))) };
}

export function isDateInMonth(date: IsoDate, month: MonthKey): boolean {
  return toMonthKey(date) === month;
}

/** Inclusive range check using string comparison (valid for ISO dates). */
export function isDateInRange(date: IsoDate, start: IsoDate, end: IsoDate): boolean {
  return date >= start && date <= end;
}

/** Moves a month key forwards or backwards: ("2026-01", -1) → "2025-12". */
export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  return format(addMonths(parseIsoDate(`${month}-01`), delta), 'yyyy-MM');
}

/** "2026-11-23" → "23 Nov 2026" */
export function formatDisplayDate(date: IsoDate): string {
  return format(parseIsoDate(date), 'd MMM yyyy');
}

/** "2026-11" → "November 2026" */
export function formatMonthLabel(month: MonthKey): string {
  return format(parseIsoDate(`${month}-01`), 'MMMM yyyy');
}

/** Timestamp for createdAt/updatedAt. A real instant, so UTC is correct here. */
export function nowIsoDateTime(now: Date = new Date()): string {
  return now.toISOString();
}

/** "2026-11" → "Nov" (or "Nov 2026" with the year), for chart axes. */
export function formatShortMonth(month: MonthKey, withYear = false): string {
  return format(parseIsoDate(`${month}-01`), withYear ? 'MMM yyyy' : 'MMM');
}

/** The calendar date `days` away from `date` (negative goes back). */
export function addDaysToIsoDate(date: IsoDate, days: number): IsoDate {
  return toIsoDate(addDays(parseIsoDate(date), days));
}

/**
 * A day heading relative to today: "Today", "Yesterday", or the weekday and
 * date, with a short form for narrow screens and the full date for screen
 * readers.
 */
export function formatDayHeading(
  date: IsoDate,
  today: IsoDate,
): { long: string; short: string; full: string } {
  const day = parseIsoDate(date);
  const full = format(day, 'EEEE d MMMM yyyy');
  if (date === today) return { long: 'Today', short: 'Today', full };
  if (date === addDaysToIsoDate(today, -1)) return { long: 'Yesterday', short: 'Yesterday', full };
  return { long: format(day, 'EEE d MMM yyyy'), short: format(day, 'EEE d MMM'), full };
}
