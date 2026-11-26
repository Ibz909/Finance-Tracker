import { describe, expect, it } from 'vitest';
import { dailyAllowancePence, monthTiming } from './allowance';

describe('monthTiming', () => {
  it('counts the days left including today', () => {
    expect(monthTiming('2026-11', '2026-11-15')).toEqual({ kind: 'current', daysRemaining: 16 });
    expect(monthTiming('2026-11', '2026-11-01')).toEqual({ kind: 'current', daysRemaining: 30 });
  });

  it('leaves one day on the last day of the month', () => {
    expect(monthTiming('2026-11', '2026-11-30')).toEqual({ kind: 'current', daysRemaining: 1 });
    expect(monthTiming('2026-12', '2026-12-31')).toEqual({ kind: 'current', daysRemaining: 1 });
  });

  it('handles February in leap and ordinary years', () => {
    expect(monthTiming('2028-02', '2028-02-01')).toEqual({ kind: 'current', daysRemaining: 29 });
    expect(monthTiming('2027-02', '2027-02-01')).toEqual({ kind: 'current', daysRemaining: 28 });
  });

  it('counts across the UK clock change at the end of October', () => {
    // Clocks go back on 25 October 2026; calendar days must still be whole.
    expect(monthTiming('2026-10', '2026-10-24')).toEqual({ kind: 'current', daysRemaining: 8 });
  });

  it('marks past and future months', () => {
    expect(monthTiming('2026-10', '2026-11-15')).toEqual({ kind: 'past' });
    expect(monthTiming('2027-01', '2026-11-15')).toEqual({ kind: 'future', daysInMonth: 31 });
  });
});

describe('dailyAllowancePence', () => {
  it('splits what is left over the remaining days, rounding down to the penny', () => {
    // £67.02 over 4 days is £16.755: rounding down keeps the total within budget.
    expect(dailyAllowancePence(6702, { kind: 'current', daysRemaining: 4 })).toBe(1675);
    expect(dailyAllowancePence(1675 * 4, { kind: 'current', daysRemaining: 4 })).toBe(1675);
  });

  it('never adds up to more than is left', () => {
    for (const remaining of [1, 99, 6702, 100001]) {
      for (const days of [1, 3, 7, 31]) {
        const daily = dailyAllowancePence(remaining, { kind: 'current', daysRemaining: days });
        expect((daily ?? 0) * days).toBeLessThanOrEqual(remaining);
      }
    }
  });

  it('uses the whole month for a future month', () => {
    expect(dailyAllowancePence(31000, { kind: 'future', daysInMonth: 31 })).toBe(1000);
  });

  it('is unavailable for a past month or when nothing is left', () => {
    expect(dailyAllowancePence(5000, { kind: 'past' })).toBeNull();
    expect(dailyAllowancePence(0, { kind: 'current', daysRemaining: 5 })).toBeNull();
    expect(dailyAllowancePence(-1200, { kind: 'current', daysRemaining: 5 })).toBeNull();
  });
});
