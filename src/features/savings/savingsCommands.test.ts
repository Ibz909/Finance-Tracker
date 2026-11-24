import { describe, expect, it } from 'vitest';
import { makeContribution, makeGoal } from '../../test/fixtures';
import {
  buildAddContribution,
  buildAddGoal,
  buildDeleteContribution,
  buildUpdateGoal,
} from './savingsCommands';

const ctx = { id: 'new', now: '2026-11-15T12:00:00.000Z' };
const goal = makeGoal({ id: 'g' });
const deposit = (amountPence: number) => makeContribution('g', { amountPence });

describe('goal commands', () => {
  it('creates a goal, trimming the name', () => {
    const result = buildAddGoal({ name: '  Holiday  ', targetPence: 120000 }, ctx);
    expect(result).toMatchObject({
      ok: true,
      value: { goal: { id: 'new', name: 'Holiday', targetPence: 120000, isDemo: false } },
    });
  });

  it('reports a missing name and an invalid target', () => {
    expect(buildAddGoal({ name: ' ', targetPence: 0 }, ctx)).toEqual({
      ok: false,
      fieldErrors: {
        name: ['Enter a name for the goal'],
        targetPence: ['Amount must be greater than zero'],
      },
    });
  });

  it('validates updates the same way', () => {
    expect(buildUpdateGoal('g', { name: '', targetPence: 100 }, ctx).ok).toBe(false);
    expect(buildUpdateGoal('g', { name: 'Car', targetPence: 100 }, ctx)).toMatchObject({
      ok: true,
      value: { type: 'goalUpdated', id: 'g', changes: { name: 'Car', targetPence: 100 } },
    });
  });
});

describe('contribution commands', () => {
  const input = { kind: 'deposit', amountPence: 5000, date: '2026-11-15' };

  it('records a deposit against the goal', () => {
    expect(buildAddContribution(goal, input, [], ctx)).toMatchObject({
      ok: true,
      value: { contribution: { id: 'new', goalId: 'g', kind: 'deposit', amountPence: 5000 } },
    });
  });

  it('allows withdrawing exactly what the goal holds', () => {
    const result = buildAddContribution(
      goal,
      { ...input, kind: 'withdrawal', amountPence: 7500 },
      [deposit(7500)],
      ctx,
    );
    expect(result.ok).toBe(true);
  });

  it('refuses to withdraw more than the goal holds, saying how much is available', () => {
    expect(
      buildAddContribution(
        goal,
        { ...input, kind: 'withdrawal', amountPence: 7501 },
        [deposit(7500)],
        ctx,
      ),
    ).toEqual({ ok: false, fieldErrors: { amountPence: ['You can withdraw up to £75.00'] } });
  });

  it('explains when there is nothing to withdraw', () => {
    expect(buildAddContribution(goal, { ...input, kind: 'withdrawal' }, [], ctx)).toMatchObject({
      ok: false,
      fieldErrors: { amountPence: [expect.stringMatching(/nothing/)] },
    });
  });

  it('refuses to delete a deposit whose money was withdrawn', () => {
    const first = deposit(10000);
    const withdrawal = makeContribution('g', { kind: 'withdrawal', amountPence: 6000 });
    expect(buildDeleteContribution(first, [first, withdrawal])).toMatchObject({ ok: false });
    expect(buildDeleteContribution(withdrawal, [first, withdrawal])).toMatchObject({ ok: true });
  });
});
