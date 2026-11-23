import { describe, expect, it } from 'vitest';
import { makeBudget } from '../test/fixtures';
import { budgetDraftSchema, budgetKey, budgetSchema } from './budget';

describe('budgetSchema', () => {
  it('accepts overall and category budgets', () => {
    expect(budgetSchema.safeParse(makeBudget({ scope: 'overall' })).success).toBe(true);
    expect(budgetSchema.safeParse(makeBudget()).success).toBe(true);
  });

  it.each([
    ['a category budget without a category', { scope: 'category', categoryId: undefined }],
    ['an income category', { categoryId: 'salary' }],
    ['an unknown category', { categoryId: 'yachts' }],
    ['an overall budget with a category', { scope: 'overall', categoryId: 'transport' }],
    ['a zero limit', { limitPence: 0 }],
    ['fractional pence', { limitPence: 10.5 }],
  ] as const)('rejects %s', (_label, overrides) => {
    expect(budgetSchema.safeParse({ ...makeBudget(), ...overrides }).success).toBe(false);
  });
});

describe('budgetDraftSchema', () => {
  it('explains a missing category', () => {
    const result = budgetDraftSchema.safeParse({ scope: 'category', limitPence: 5000 });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['categoryId'],
      message: 'Choose a category',
    });
  });
});

describe('budgetKey', () => {
  it('identifies what a budget limits', () => {
    expect(budgetKey({ scope: 'overall' })).toBe('overall');
    expect(budgetKey({ scope: 'category', categoryId: 'transport' })).toBe('category:transport');
  });
});
