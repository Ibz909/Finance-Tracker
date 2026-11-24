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
  it('runs in UK time: GMT in winter, BST (UTC+1) in summer', () => {
    // vite.config.ts sets TZ=Europe/London for tests.
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(0);
    expect(new Date(2026, 6, 15).getTimezoneOffset()).toBe(-60);
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

  it('reads the date as local time, unlike new Date("YYYY-MM-DD")', () => {
    // The pitfall this module avoids: new Date() reads a bare date as UTC
    // midnight. In BST that is 1am local time, and in any timezone behind
    // UTC (the Americas) it is the previous evening, a different day.
    expect(new Date('2026-07-01').getHours()).toBe(1);
    const parsed = parseIsoDate('2026-07-01');
    expect([parsed.getDate(), parsed.getHours()]).toEqual([1, 0]);
  });

  it('throws on invalid dates', () => {
    expect(() => parseIsoDate('2026-02-30')).toThrow(RangeError);
  });
});

describe('today and current month', () => {
  it('use the local calendar date, not the UTC one', () => {
    // 00:30 on 1 July in BST is still 30 June in UTC.
    const justAfterMidnight = new Date(2026, 6, 1, 0, 30);
    expect(justAfterMidnight.toISOString().slice(0, 10)).toBe('2026-06-30');
    expect(todayIsoDate(justAfterMidnight)).toBe('2026-07-01');
    expect(currentMonthKey(justAfterMidnight)).toBe('2026-07');
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

describe('British Summer Time', () => {
  // UK clocks go forward at 1am on 29 March 2026 and back at 2am on 25 October.
  // Days around the change are 23 or 25 hours long, which breaks code that
  // adds 24 hours to move a day, or that reads dates in UTC.

  it('parses the clock-change days to local midnight on the right date', () => {
    for (const day of ['2026-03-29', '2026-10-25']) {
      const date = parseIsoDate(day);
      expect([date.getDate(), date.getHours()]).toEqual([Number(day.slice(8)), 0]);
    }
  });

  it('keeps month bounds right in the months the clocks change', () => {
    expect(getMonthBounds('2026-03')).toEqual({ start: '2026-03-01', end: '2026-03-31' });
    expect(getMonthBounds('2026-10')).toEqual({ start: '2026-10-01', end: '2026-10-31' });
  });

  it('moves between GMT and BST months without skipping or repeating one', () => {
    expect(shiftMonth('2026-03', 1)).toBe('2026-04');
    expect(shiftMonth('2026-10', 1)).toBe('2026-11');
    expect(shiftMonth('2026-04', -1)).toBe('2026-03');
  });

  it('shows summer dates as the local calendar day', () => {
    expect(formatDisplayDate('2026-07-01')).toBe('1 Jul 2026');
    expect(isDateInMonth('2026-07-01', '2026-07')).toBe(true);
  });

  it('gives today’s date just after midnight in summer, when UTC is still yesterday', () => {
    const earlyMorning = new Date(2026, 3, 1, 0, 15); // 00:15 BST on 1 April
    expect(todayIsoDate(earlyMorning)).toBe('2026-04-01');
    expect(currentMonthKey(earlyMorning)).toBe('2026-04');
  });
});
