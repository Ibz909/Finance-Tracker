import { describe, expect, it } from 'vitest';
import {
  dueDatesBetween,
  firstOccurrenceOnOrAfter,
  MAX_OCCURRENCES,
  nthOccurrence,
} from './schedule';

describe('nthOccurrence', () => {
  it('returns the start date for n = 0', () => {
    expect(nthOccurrence('2026-03-15', 'monthly', 0)).toBe('2026-03-15');
  });

  it('steps weekly and fortnightly across month and year ends', () => {
    expect(nthOccurrence('2026-12-28', 'weekly', 1)).toBe('2027-01-04');
    expect(nthOccurrence('2026-01-26', 'fortnightly', 1)).toBe('2026-02-09');
    expect(nthOccurrence('2026-01-26', 'fortnightly', 3)).toBe('2026-03-09');
  });

  it('clamps the 31st to shorter months without drifting', () => {
    const dates = [0, 1, 2, 3, 4].map((n) => nthOccurrence('2026-01-31', 'monthly', n));
    expect(dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
  });

  it('uses 29 February in leap years', () => {
    expect(nthOccurrence('2028-01-31', 'monthly', 1)).toBe('2028-02-29');
  });

  it('moves 29 February to the 28th in non-leap years, and back in leap years', () => {
    expect(nthOccurrence('2028-02-29', 'yearly', 1)).toBe('2029-02-28');
    expect(nthOccurrence('2028-02-29', 'yearly', 4)).toBe('2032-02-29');
  });

  it('is unaffected by daylight-saving changes', () => {
    // UK clocks go forward on 29 March 2026; US clocks on 8 March.
    expect(nthOccurrence('2026-03-02', 'weekly', 1)).toBe('2026-03-09');
    expect(nthOccurrence('2026-03-25', 'weekly', 1)).toBe('2026-04-01');
  });
});

describe('dueDatesBetween', () => {
  it('lists every date in the window, inclusive at both ends', () => {
    expect(dueDatesBetween('2026-01-01', 'monthly', '2026-03-01', '2026-05-01')).toEqual([
      '2026-03-01',
      '2026-04-01',
      '2026-05-01',
    ]);
  });

  it('returns nothing when the schedule starts after the window', () => {
    expect(dueDatesBetween('2026-12-01', 'monthly', '2026-01-01', '2026-11-30')).toEqual([]);
  });

  it('stops at the end date, even between two payments', () => {
    expect(
      dueDatesBetween('2026-01-10', 'monthly', '2026-01-01', '2026-12-31', '2026-03-20'),
    ).toEqual(['2026-01-10', '2026-02-10', '2026-03-10']);
  });

  it('never returns more than the safety limit', () => {
    expect(dueDatesBetween('1900-01-01', 'weekly', '1900-01-01', '2026-11-15')).toHaveLength(
      MAX_OCCURRENCES,
    );
  });
});

describe('firstOccurrenceOnOrAfter', () => {
  it('returns the date itself when a payment falls on it', () => {
    expect(firstOccurrenceOnOrAfter('2026-01-15', 'monthly', '2026-11-15')).toBe('2026-11-15');
  });

  it('returns the next payment after the date', () => {
    expect(firstOccurrenceOnOrAfter('2026-01-31', 'monthly', '2026-11-01')).toBe('2026-11-30');
  });

  it('returns the start date when it is still in the future', () => {
    expect(firstOccurrenceOnOrAfter('2027-01-01', 'yearly', '2026-11-15')).toBe('2027-01-01');
  });

  it('returns null once the schedule has ended', () => {
    expect(
      firstOccurrenceOnOrAfter('2026-01-01', 'monthly', '2026-11-15', '2026-11-14'),
    ).toBeNull();
  });
});
