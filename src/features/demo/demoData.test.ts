import { describe, expect, it } from 'vitest';
import { transactionSchema } from '../../models/transaction';
import { DEMO_ID_PREFIX, DEMO_MONTHS, generateDemoTransactions } from './demoData';

const NOW = new Date(2026, 10, 15, 12, 0); // 15 November 2026, local time
const demo = generateDemoTransactions(NOW);

describe('generateDemoTransactions', () => {
  it('is deterministic for the same date', () => {
    expect(generateDemoTransactions(NOW)).toEqual(demo);
  });

  it('produces only valid, flagged demo records with unique IDs', () => {
    for (const transaction of demo) {
      expect(transactionSchema.safeParse(transaction).success).toBe(true);
      expect(transaction.isDemo).toBe(true);
      expect(transaction.id.startsWith(DEMO_ID_PREFIX)).toBe(true);
    }
    expect(new Set(demo.map((t) => t.id)).size).toBe(demo.length);
  });

  it(`covers the last ${String(DEMO_MONTHS)} calendar months and nothing after today`, () => {
    const months = new Set(demo.map((t) => t.date.slice(0, 7)));
    expect([...months].sort()).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(demo.every((t) => t.date <= '2026-11-15')).toBe(true);
  });

  it('only includes this month’s items that have already happened', () => {
    const november = demo.filter((t) => t.date.startsWith('2026-11'));
    expect(november.some((t) => t.description === 'Monthly salary')).toBe(true); // 1st
    expect(november.some((t) => t.description === 'Friday takeaway')).toBe(false); // 27th
  });

  it('includes realistic income and the expense categories from the brief', () => {
    const categories = new Set(demo.map((t) => t.categoryId));
    for (const id of [
      'salary',
      'food_groceries',
      'rent_housing',
      'transport',
      'subscriptions',
      'restaurants_takeaways',
      'entertainment',
    ]) {
      expect(categories).toContain(id);
    }
    // Salary lands on the 1st, so every month (even this one) has income.
    const salaries = demo.filter((t) => t.categoryId === 'salary');
    expect(salaries).toHaveLength(DEMO_MONTHS);
  });

  it('gives each calendar month the same amounts whenever it is generated', () => {
    const later = generateDemoTransactions(new Date(2027, 0, 31, 12, 0));
    const septemberNow = demo.filter((t) => t.date.startsWith('2026-09'));
    const septemberLater = later.filter((t) => t.date.startsWith('2026-09'));
    expect(septemberLater).toEqual(septemberNow);
  });

  it('works across a year boundary and in a leap-year February', () => {
    const february = generateDemoTransactions(new Date(2028, 1, 29, 12, 0));
    const months = new Set(february.map((t) => t.date.slice(0, 7)));
    expect([...months].sort()).toEqual([
      '2027-09',
      '2027-10',
      '2027-11',
      '2027-12',
      '2028-01',
      '2028-02',
    ]);
    expect(february.every((t) => transactionSchema.safeParse(t).success)).toBe(true);
  });
});
