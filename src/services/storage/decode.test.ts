import { describe, expect, it } from 'vitest';
import {
  makeBudget,
  makeContribution,
  makeGoal,
  makeSchedule,
  makeTransaction,
} from '../../test/fixtures';
import { decodeAppData } from './decode';
import { CURRENT_SCHEMA_VERSION } from './envelope';

function envelope(data: unknown, schemaVersion = CURRENT_SCHEMA_VERSION) {
  return { schemaVersion, data };
}

const settings = { currency: 'GBP' };
const budgets: unknown[] = [];
const recurringSchedules: unknown[] = [];
/** Version 4 sections, empty unless a test is about goals. */
const goals = { savingsGoals: [], goalContributions: [] };

describe('decodeAppData', () => {
  it('accepts fully valid data', () => {
    const transactions = [
      makeTransaction(),
      makeTransaction({ type: 'income', categoryId: 'salary' }),
    ];
    expect(
      decodeAppData(envelope({ transactions, budgets, recurringSchedules, ...goals, settings })),
    ).toEqual({
      kind: 'valid',
      data: { transactions, budgets, recurringSchedules, ...goals, settings },
    });
  });

  it.each([
    ['a bare array', []],
    ['null', null],
    ['an envelope without a version', { data: {} }],
    ['a string version', { schemaVersion: '1', data: {} }],
  ])('rejects %s', (_label, raw) => {
    expect(decodeAppData(raw)).toMatchObject({ kind: 'invalid' });
  });

  it('rejects data written by a newer app version', () => {
    const result = decodeAppData(envelope({ transactions: [], budgets, settings }, 99));
    expect(result).toMatchObject({ kind: 'invalid' });
    if (result.kind === 'invalid') expect(result.problem).toMatch(/newer version/);
  });

  it('rejects data missing the transactions section', () => {
    expect(decodeAppData(envelope({ settings }))).toMatchObject({ kind: 'invalid' });
  });

  it('keeps valid transactions and skips invalid ones', () => {
    const good = makeTransaction();
    const result = decodeAppData(
      envelope({
        transactions: [good, { ...makeTransaction(), amountPence: -5 }, 'garbage'],
        budgets,
        recurringSchedules,
        ...goals,
        settings,
      }),
    );

    expect(result).toMatchObject({ kind: 'partial', skippedRecords: 2 });
    if (result.kind === 'partial') {
      expect(result.data.transactions).toEqual([good]);
      expect(result.problem).toMatch(/2 saved transactions were invalid/);
    }
  });

  it('skips duplicate IDs, keeping the first', () => {
    const first = makeTransaction({ id: 'dup', description: 'First' });
    const second = makeTransaction({ id: 'dup', description: 'Second' });
    const result = decodeAppData(
      envelope({ transactions: [first, second], budgets, recurringSchedules, ...goals, settings }),
    );

    expect(result).toMatchObject({ kind: 'partial', skippedRecords: 1 });
    if (result.kind === 'partial') expect(result.data.transactions).toEqual([first]);
  });

  it('resets invalid settings but keeps transactions', () => {
    const transactions = [makeTransaction()];
    const result = decodeAppData(
      envelope({
        transactions,
        budgets,
        recurringSchedules,
        ...goals,
        settings: { currency: 'USD' },
      }),
    );

    expect(result).toMatchObject({ kind: 'partial', skippedRecords: 0 });
    if (result.kind === 'partial') {
      expect(result.data).toEqual({
        transactions,
        budgets,
        recurringSchedules: [],
        ...goals,
        settings,
      });
      expect(result.problem).toMatch(/Settings were invalid/);
    }
  });

  it('upgrades version 1 data, which had no budgets, without losing anything', () => {
    const transactions = [makeTransaction()];
    const result = decodeAppData({ schemaVersion: 1, data: { transactions, settings } });

    expect(result).toEqual({
      kind: 'valid',
      data: { transactions, budgets: [], recurringSchedules: [], ...goals, settings },
    });
  });

  it('upgrades version 2 data, which had no recurring schedules', () => {
    const budgets = [makeBudget()];
    const result = decodeAppData({
      schemaVersion: 2,
      data: { transactions: [], budgets, settings },
    });

    expect(result).toEqual({
      kind: 'valid',
      data: { transactions: [], budgets, recurringSchedules: [], ...goals, settings },
    });
  });

  it('keeps valid recurring schedules and skips invalid or duplicate ones', () => {
    const rent = makeSchedule({ id: 's1' });
    const result = decodeAppData(
      envelope({
        transactions: [],
        budgets: [],
        recurringSchedules: [
          rent,
          makeSchedule({ id: 's1' }), // duplicate ID
          makeSchedule({ id: 's2', frequency: 'daily' as never }),
          makeSchedule({ id: 's3', startDate: '2026-05-01', endDate: '2026-04-01' }),
        ],
        ...goals,
        settings,
      }),
    );

    expect(result).toMatchObject({ kind: 'partial', skippedRecords: 3 });
    if (result.kind === 'partial') {
      expect(result.data.recurringSchedules).toEqual([rent]);
      expect(result.problem).toMatch(/3 saved recurring transactions were invalid/);
    }
  });

  it('upgrades version 3 data, which had no savings goals', () => {
    const result = decodeAppData({
      schemaVersion: 3,
      data: { transactions: [], budgets: [], recurringSchedules: [], settings },
    });
    expect(result).toEqual({
      kind: 'valid',
      data: { transactions: [], budgets: [], recurringSchedules: [], ...goals, settings },
    });
  });

  it('keeps valid goals and contributions, skipping invalid ones and orphans', () => {
    const goal = makeGoal({ id: 'g1' });
    const deposit = makeContribution('g1');
    const result = decodeAppData(
      envelope({
        transactions: [],
        budgets: [],
        recurringSchedules: [],
        savingsGoals: [goal, makeGoal({ id: 'g1' }), { ...makeGoal(), targetPence: 0 }],
        goalContributions: [
          deposit,
          makeContribution('missing-goal'),
          { ...makeContribution('g1'), kind: 'transfer' },
        ],
        settings,
      }),
    );

    expect(result).toMatchObject({ kind: 'partial', skippedRecords: 4 });
    if (result.kind === 'partial') {
      expect(result.data.savingsGoals).toEqual([goal]);
      expect(result.data.goalContributions).toEqual([deposit]);
      expect(result.problem).toMatch(/4 saved savings goal records were invalid/);
    }
  });

  it('keeps valid budgets and skips invalid or duplicate ones', () => {
    const overall = makeBudget({ id: 'b1', scope: 'overall' });
    const groceries = makeBudget({ id: 'b2', scope: 'category', categoryId: 'food_groceries' });
    const result = decodeAppData(
      envelope({
        transactions: [],
        budgets: [
          overall,
          groceries,
          makeBudget({ id: 'b3', scope: 'overall' }), // second overall budget
          makeBudget({ id: 'b4', scope: 'category', categoryId: 'food_groceries' }), // duplicate category
          makeBudget({ id: 'b5', scope: 'category', categoryId: 'salary' }), // income category
          { ...makeBudget({ id: 'b6' }), limitPence: 0 },
        ],
        recurringSchedules,
        ...goals,
        settings,
      }),
    );

    expect(result).toMatchObject({ kind: 'partial', skippedRecords: 4 });
    if (result.kind === 'partial') {
      expect(result.data.budgets).toEqual([overall, groceries]);
      expect(result.problem).toMatch(/4 saved budgets were invalid or duplicated/);
    }
  });
});
