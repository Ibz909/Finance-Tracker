import { describe, expect, it } from 'vitest';
import { makeBudget } from '../../test/fixtures';
import { buildAddBudget, buildUpdateBudgetLimit } from './budgetCommands';

const ctx = { id: 'new', now: '2026-11-23T10:00:00.000Z' };

describe('buildAddBudget', () => {
  it('creates a real (non-demo) budget', () => {
    const result = buildAddBudget(
      { scope: 'category', categoryId: 'transport', limitPence: 8000 },
      [],
      ctx,
    );
    expect(result).toEqual({
      ok: true,
      value: {
        type: 'budgetAdded',
        budget: {
          id: 'new',
          scope: 'category',
          categoryId: 'transport',
          limitPence: 8000,
          createdAt: ctx.now,
          updatedAt: ctx.now,
          isDemo: false,
        },
      },
    });
  });

  it('refuses a second overall budget', () => {
    const result = buildAddBudget(
      { scope: 'overall', limitPence: 1000 },
      [makeBudget({ scope: 'overall' })],
      ctx,
    );
    expect(result).toEqual({
      ok: false,
      fieldErrors: { scope: ['You already have an overall monthly budget'] },
    });
  });

  it('refuses a second budget for the same category, naming it', () => {
    const result = buildAddBudget(
      { scope: 'category', categoryId: 'food_groceries', limitPence: 1000 },
      [makeBudget({ categoryId: 'food_groceries' })],
      ctx,
    );
    expect(result).toEqual({
      ok: false,
      fieldErrors: { categoryId: ['Food & Groceries already has a budget'] },
    });
  });

  it('rejects invalid input', () => {
    expect(buildAddBudget({ scope: 'category', limitPence: 0 }, [], ctx).ok).toBe(false);
  });
});

describe('buildUpdateBudgetLimit', () => {
  it('accepts a valid new limit', () => {
    expect(buildUpdateBudgetLimit('b1', 45000, { now: ctx.now })).toEqual({
      ok: true,
      value: { type: 'budgetUpdated', id: 'b1', limitPence: 45000, updatedAt: ctx.now },
    });
  });

  it('rejects a zero limit', () => {
    expect(buildUpdateBudgetLimit('b1', 0, { now: ctx.now }).ok).toBe(false);
  });
});
