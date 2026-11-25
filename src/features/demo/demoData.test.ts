import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import { budgetKey, budgetSchema } from '../../models/budget';
import { goalContributionSchema, savingsGoalSchema } from '../../models/savings';
import { transactionSchema } from '../../models/transaction';
import {
  makeBudget,
  makeContribution,
  makeGoal,
  makeSchedule,
  makeTransaction,
} from '../../test/fixtures';
import { getMonthBudgets } from '../budgets/budgetProgress';
import { savedPence } from '../savings/goalProgress';
import {
  DEMO_ID_PREFIX,
  DEMO_MONTHS,
  generateDemoBudgets,
  generateDemoGoals,
  generateDemoTransactions,
  hasDemoData,
} from './demoData';

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

describe('generateDemoBudgets', () => {
  const budgets = generateDemoBudgets(NOW);

  it('produces valid, flagged, non-overlapping budgets', () => {
    for (const budget of budgets) {
      expect(budgetSchema.safeParse(budget).success).toBe(true);
      expect(budget.isDemo).toBe(true);
      expect(budget.id.startsWith(DEMO_ID_PREFIX)).toBe(true);
    }
    const keys = budgets.map(budgetKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('overall');
  });

  it('shows a mix of statuses against a full month of demo spending', () => {
    const { categories } = getMonthBudgets(budgets, demo, '2026-10');
    const statuses = new Set(categories.map((p) => p.status));
    expect(statuses).toEqual(new Set(['normal', 'warning', 'exceeded']));
  });
});

describe('generateDemoGoals', () => {
  const { goals, contributions } = generateDemoGoals(NOW);

  it('produces valid, flagged goals and deposits that belong to them', () => {
    const ids = new Set(goals.map((g) => g.id));
    for (const goal of goals) {
      expect(savingsGoalSchema.safeParse(goal).success).toBe(true);
      expect(goal.isDemo).toBe(true);
    }
    for (const c of contributions) {
      expect(goalContributionSchema.safeParse(c).success).toBe(true);
      expect(c.isDemo).toBe(true);
      expect(ids.has(c.goalId)).toBe(true);
      expect(c.date <= '2026-11-15').toBe(true);
    }
  });

  it('shows one undated goal and one with a future target date', () => {
    expect(goals.map((g) => g.targetDate)).toEqual([undefined, '2027-07-31']);
    // 6 × £250 into the emergency fund, 4 × £150 into the holiday.
    expect(savedPence(contributions, 'demo-goal-emergency')).toBe(150000);
    expect(savedPence(contributions, 'demo-goal-holiday')).toBe(60000);
  });

  it('is deterministic', () => {
    expect(generateDemoGoals(NOW)).toEqual(generateDemoGoals(NOW));
  });
});

describe('hasDemoData', () => {
  it('is false with no data, or only real data', () => {
    expect(hasDemoData(createEmptyAppData())).toBe(false);
    expect(
      hasDemoData({
        ...createEmptyAppData(),
        transactions: [makeTransaction({ isDemo: false })],
        budgets: [makeBudget({ isDemo: false })],
        recurringSchedules: [makeSchedule({ isDemo: false })],
        savingsGoals: [makeGoal({ isDemo: false })],
        goalContributions: [makeContribution('goal-1', { isDemo: false })],
      }),
    ).toBe(false);
  });

  it.each([
    ['transactions', { transactions: [makeTransaction({ isDemo: true })] }],
    ['budgets', { budgets: [makeBudget({ isDemo: true })] }],
    ['recurringSchedules', { recurringSchedules: [makeSchedule({ isDemo: true })] }],
    ['savingsGoals', { savingsGoals: [makeGoal({ isDemo: true })] }],
    ['goalContributions', { goalContributions: [makeContribution('goal-1', { isDemo: true })] }],
  ])('is true when %s include a demo record', (_name, records) => {
    expect(hasDemoData({ ...createEmptyAppData(), ...records })).toBe(true);
  });
});
