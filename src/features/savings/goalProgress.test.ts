import { describe, expect, it } from 'vitest';
import { makeContribution, makeGoal } from '../../test/fixtures';
import {
  contributionsFor,
  getAllGoalProgress,
  getGoalProgress,
  monthlyAmountNeeded,
  savedPence,
} from './goalProgress';

const today = '2026-11-15';

describe('monthlyAmountNeeded', () => {
  it('counts this month and the target month: Nov to Mar is 5 months', () => {
    expect(monthlyAmountNeeded(100000, today, '2027-03-01')).toBe(20000);
  });

  it('ignores the day of the month on both ends', () => {
    expect(monthlyAmountNeeded(100000, '2026-11-30', '2027-03-01')).toBe(20000);
    expect(monthlyAmountNeeded(100000, '2026-11-01', '2027-03-31')).toBe(20000);
  });

  it('rounds up to the next penny so the target is always reached', () => {
    // £1,000 over 3 months: 3 × £333.33 would be 1p short.
    expect(monthlyAmountNeeded(100000, today, '2027-01-15')).toBe(33334);
  });

  it('asks for everything remaining when the target is this month', () => {
    expect(monthlyAmountNeeded(12345, today, '2026-11-30')).toBe(12345);
    expect(monthlyAmountNeeded(12345, today, today)).toBe(12345);
  });

  it('crosses year ends correctly', () => {
    expect(monthlyAmountNeeded(120000, '2026-12-10', '2027-11-10')).toBe(10000);
  });

  it('returns null when nothing is left to save', () => {
    expect(monthlyAmountNeeded(0, today, '2027-03-01')).toBeNull();
    expect(monthlyAmountNeeded(-500, today, '2027-03-01')).toBeNull();
  });

  it('returns null once the target date has passed', () => {
    expect(monthlyAmountNeeded(10000, today, '2026-11-14')).toBeNull();
  });
});

describe('savedPence', () => {
  it('adds deposits and subtracts withdrawals for one goal only', () => {
    const contributions = [
      makeContribution('a', { amountPence: 50000 }),
      makeContribution('a', { amountPence: 12550 }),
      makeContribution('a', { kind: 'withdrawal', amountPence: 2550 }),
      makeContribution('b', { amountPence: 99999 }),
    ];
    expect(savedPence(contributions, 'a')).toBe(60000);
  });
});

describe('getGoalProgress', () => {
  it('reports saved, remaining, percent and monthly amount', () => {
    const goal = makeGoal({ id: 'g', targetPence: 300000, targetDate: '2027-03-31' });
    const progress = getGoalProgress(goal, [makeContribution('g', { amountPence: 125000 })], today);

    expect(progress).toMatchObject({
      savedPence: 125000,
      remainingPence: 175000,
      percent: 41, // 41.67%, rounded down
      status: 'in-progress',
      monthlyNeededPence: 35000,
    });
  });

  it('never shows 100% until the target is fully reached', () => {
    const goal = makeGoal({ id: 'g', targetPence: 100000 });
    expect(
      getGoalProgress(goal, [makeContribution('g', { amountPence: 99999 })], today),
    ).toMatchObject({ percent: 99, status: 'in-progress' });
  });

  it('marks a goal reached, with nothing remaining, even beyond the target', () => {
    const goal = makeGoal({ id: 'g', targetPence: 10000, targetDate: '2026-01-01' });
    expect(
      getGoalProgress(goal, [makeContribution('g', { amountPence: 15000 })], today),
    ).toMatchObject({
      remainingPence: 0,
      percent: 150,
      status: 'reached',
      monthlyNeededPence: null,
    });
  });

  it('marks an unreached goal overdue once its date has passed', () => {
    const goal = makeGoal({ targetDate: '2026-10-31' });
    expect(getGoalProgress(goal, [], today)).toMatchObject({
      status: 'overdue',
      monthlyNeededPence: null,
    });
  });

  it('has no monthly amount without a target date', () => {
    expect(getGoalProgress(makeGoal(), [], today).monthlyNeededPence).toBeNull();
  });
});

describe('ordering', () => {
  it('lists unfinished goals by target date, undated next, reached last', () => {
    const done = makeGoal({ id: 'done', targetPence: 100 });
    const later = makeGoal({ id: 'later', targetDate: '2027-06-01' });
    const undated = makeGoal({ id: 'undated' });
    const soon = makeGoal({ id: 'soon', targetDate: '2026-12-25' });

    const order = getAllGoalProgress(
      [done, later, undated, soon],
      [makeContribution('done', { amountPence: 100 })],
      today,
    ).map((p) => p.goal.id);

    expect(order).toEqual(['soon', 'later', 'undated', 'done']);
  });

  it('lists a goal’s contributions newest first', () => {
    const older = makeContribution('g', { date: '2026-09-01' });
    const newer = makeContribution('g', { date: '2026-10-01' });
    expect(contributionsFor([older, newer, makeContribution('x')], 'g')).toEqual([newer, older]);
  });
});
