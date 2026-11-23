import { describe, expect, it } from 'vitest';
import {
  currentMonthKey,
  formatDisplayDate,
  formatMonthLabel,
  getMonthBounds,
  isDateInMonth,
  isDateInRange,
  isValidIsoDate,
  isValidMonthKey,
  parseIsoDate,
  shiftMonth,
  todayIsoDate,
  toMonthKey,
} from './dates';

describe('test environment', () => {
  it('runs in a timezone behind UTC so UTC-conversion bugs surface', () => {
    // vite.config.ts sets TZ=America/Los_Angeles for tests.
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(480);
  });
});

describe('isValidIsoDate', () => {
  it.each(['2026-01-01', '2026-12-31', '2024-02-29', '2000-02-29'])('accepts %s', (value) => {
    expect(isValidIsoDate(value)).toBe(true);
  });

  it.each([
    '2026-02-29', // not a leap year
    '1900-02-29', // century, not divisible by 400
    '2026-02-30',
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
    '2026-1-5',
    '26-01-01',
    '2026-01-01T00:00:00Z',
    '',
    'yesterday',
  ])('rejects %s', (value) => {
    expect(isValidIsoDate(value)).toBe(false);
  });
});

describe('isValidMonthKey', () => {
  it('accepts real months and rejects others', () => {
    expect(isValidMonthKey('2026-11')).toBe(true);
    expect(isValidMonthKey('2026-13')).toBe(false);
    expect(isValidMonthKey('2026-1')).toBe(false);
  });
});

describe('parseIsoDate', () => {
  it('parses to local midnight on the same calendar day', () => {
    const date = parseIsoDate('2026-03-01');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 2, 1, 0,
    ]);
  });

  it('does not shift the day the way new Date("YYYY-MM-DD") does', () => {
    // The pitfall this module exists to avoid: UTC midnight is the previous
    // evening in Los Angeles.
    expect(new Date('2026-03-01').getDate()).toBe(28);
    expect(parseIsoDate('2026-03-01').getDate()).toBe(1);
  });

  it('throws on invalid dates', () => {
    expect(() => parseIsoDate('2026-02-30')).toThrow(RangeError);
  });
});

describe('today and current month', () => {
  it('use the local calendar date, not the UTC one', () => {
    // 11pm on 31 Dec in Los Angeles is already 1 Jan in UTC.
    const lateNight = new Date(2026, 11, 31, 23, 0);
    expect(lateNight.toISOString().slice(0, 10)).toBe('2027-01-01');
    expect(todayIsoDate(lateNight)).toBe('2026-12-31');
    expect(currentMonthKey(lateNight)).toBe('2026-12');
  });
});

describe('getMonthBounds', () => {
  it.each([
    ['2026-01', '2026-01-01', '2026-01-31'],
    ['2026-04', '2026-04-01', '2026-04-30'],
    ['2026-02', '2026-02-01', '2026-02-28'],
    ['2024-02', '2024-02-01', '2024-02-29'],
    ['2026-12', '2026-12-01', '2026-12-31'],
  ])('%s runs from %s to %s', (month, start, end) => {
    expect(getMonthBounds(month)).toEqual({ start, end });
  });
});

describe('month membership and ranges', () => {
  it('matches dates to their month', () => {
    expect(toMonthKey('2026-11-23')).toBe('2026-11');
    expect(isDateInMonth('2026-11-30', '2026-11')).toBe(true);
    expect(isDateInMonth('2026-12-01', '2026-11')).toBe(false);
  });

  it('checks inclusive ranges', () => {
    expect(isDateInRange('2026-01-01', '2026-01-01', '2026-01-31')).toBe(true);
    expect(isDateInRange('2026-01-31', '2026-01-01', '2026-01-31')).toBe(true);
    expect(isDateInRange('2026-02-01', '2026-01-01', '2026-01-31')).toBe(false);
  });
});

describe('shiftMonth', () => {
  it.each([
    ['2026-11', 1, '2026-12'],
    ['2026-12', 1, '2027-01'],
    ['2026-01', -1, '2025-12'],
    ['2026-03', -12, '2025-03'],
    ['2026-03', 0, '2026-03'],
  ])('%s shifted by %i is %s', (month, delta, expected) => {
    expect(shiftMonth(month, delta)).toBe(expected);
  });
});

describe('display formatting', () => {
  it('formats dates and months in UK style', () => {
    expect(formatDisplayDate('2026-11-03')).toBe('3 Nov 2026');
    expect(formatMonthLabel('2026-11')).toBe('November 2026');
  });
});
