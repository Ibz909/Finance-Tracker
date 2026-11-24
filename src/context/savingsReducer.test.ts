import { describe, expect, it } from 'vitest';
import type { AppData } from '../models/appData';
import { createEmptyAppData } from '../models/appData';
import type { GoalContribution, SavingsGoal } from '../models/savings';
import { makeContribution, makeGoal } from '../test/fixtures';
import { appDataReducer } from './appDataReducer';

function stateWith(goals: SavingsGoal[], contributions: GoalContribution[] = []): AppData {
  return { ...createEmptyAppData(), savingsGoals: goals, goalContributions: contributions };
}

const now = '2026-11-15T12:00:00.000Z';

describe('savings goals in the reducer', () => {
  it('adds a goal', () => {
    const goal = makeGoal();
    expect(appDataReducer(stateWith([]), { type: 'goalAdded', goal }).savingsGoals).toEqual([goal]);
  });

  it('updates a goal and removes a cleared target date', () => {
    const goal = makeGoal({ id: 'g', targetDate: '2027-03-01' });
    const after = appDataReducer(stateWith([goal]), {
      type: 'goalUpdated',
      id: 'g',
      changes: { name: 'Rainy day fund', targetPence: 400000 },
      updatedAt: now,
    });

    const { targetDate: _cleared, ...rest } = goal;
    expect(after.savingsGoals[0]).toEqual({
      ...rest,
      name: 'Rainy day fund',
      targetPence: 400000,
      updatedAt: now,
    });
    expect(after.savingsGoals[0]).not.toHaveProperty('targetDate');
  });

  it('deletes a goal together with its contributions only', () => {
    const other = makeContribution('other');
    const after = appDataReducer(
      stateWith([makeGoal({ id: 'g' }), makeGoal({ id: 'other' })], [makeContribution('g'), other]),
      { type: 'goalDeleted', id: 'g' },
    );

    expect(after.savingsGoals.map((g) => g.id)).toEqual(['other']);
    expect(after.goalContributions).toEqual([other]);
  });

  it('adds and deletes contributions', () => {
    const contribution = makeContribution('g');
    let state = appDataReducer(stateWith([makeGoal({ id: 'g' })]), {
      type: 'contributionAdded',
      contribution,
    });
    expect(state.goalContributions).toEqual([contribution]);

    state = appDataReducer(state, { type: 'contributionDeleted', id: contribution.id });
    expect(state.goalContributions).toEqual([]);
  });

  it('ignores a contribution for a goal that does not exist', () => {
    const before = stateWith([]);
    expect(
      appDataReducer(before, { type: 'contributionAdded', contribution: makeContribution('nope') }),
    ).toBe(before);
  });

  it('loads demo goals in place of earlier ones and clears only demo records', () => {
    const real = makeGoal({ id: 'real' });
    const realDeposit = makeContribution('real');
    const oldDemo = makeGoal({ id: 'demo-old', isDemo: true });
    const newDemo = makeGoal({ id: 'demo-new', isDemo: true });
    const demoDeposit = makeContribution('demo-new', { isDemo: true });

    let state = appDataReducer(stateWith([real, oldDemo], [realDeposit]), {
      type: 'demoDataLoaded',
      transactions: [],
      budgets: [],
      goals: [newDemo],
      contributions: [demoDeposit],
    });
    expect(state.savingsGoals).toEqual([real, newDemo]);
    expect(state.goalContributions).toEqual([realDeposit, demoDeposit]);

    state = appDataReducer(state, { type: 'demoDataCleared' });
    expect(state.savingsGoals).toEqual([real]);
    expect(state.goalContributions).toEqual([realDeposit]);
  });
});
