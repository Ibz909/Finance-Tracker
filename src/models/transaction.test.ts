import { describe, expect, it } from 'vitest';
import { MAX_AMOUNT_PENCE } from '../constants/money';
import { makeTransaction } from '../test/fixtures';
import { transactionDraftSchema, transactionSchema } from './transaction';

function issuesFor(value: unknown) {
  const result = transactionSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('transactionSchema', () => {
  it('accepts a valid transaction', () => {
    expect(transactionSchema.safeParse(makeTransaction()).success).toBe(true);
  });

  it('accepts optional notes and a recurring reference', () => {
    const result = transactionSchema.safeParse(
      makeTransaction({ notes: 'Split with flatmate', recurringScheduleId: 'sched-1' }),
    );
    expect(result.success).toBe(true);
  });

  it('trims the description', () => {
    const result = transactionSchema.parse(makeTransaction({ description: '  Coffee  ' }));
    expect(result.description).toBe('Coffee');
  });

  it.each([
    ['zero amount', { amountPence: 0 }, 'amountPence'],
    ['negative amount', { amountPence: -100 }, 'amountPence'],
    ['fractional pence', { amountPence: 12.5 }, 'amountPence'],
    ['amount over the maximum', { amountPence: MAX_AMOUNT_PENCE + 1 }, 'amountPence'],
    ['blank description', { description: '   ' }, 'description'],
    ['over-long description', { description: 'x'.repeat(101) }, 'description'],
    ['impossible date', { date: '2026-02-30' }, 'date'],
    ['date with a time', { date: '2026-03-15T10:00' }, 'date'],
    ['unknown category', { categoryId: 'yachts' }, 'categoryId'],
    ['income category on an expense', { categoryId: 'salary' }, 'categoryId'],
    ['bad timestamp', { createdAt: 'yesterday' }, 'createdAt'],
  ])('rejects %s', (_label, overrides, path) => {
    expect(issuesFor(makeTransaction(overrides))).toContain(path);
  });

  it('rejects records missing required fields', () => {
    const { isDemo: _isDemo, ...withoutFlag } = makeTransaction();
    expect(issuesFor(withoutFlag)).toContain('isDemo');
  });
});

describe('transactionDraftSchema', () => {
  it('accepts form input without system fields', () => {
    const result = transactionDraftSchema.safeParse({
      type: 'income',
      amountPence: 250000,
      categoryId: 'salary',
      description: 'November salary',
      date: '2026-11-28',
    });
    expect(result.success).toBe(true);
  });

  it('explains a category/type mismatch on the category field', () => {
    const result = transactionDraftSchema.safeParse({
      type: 'expense',
      amountPence: 500,
      categoryId: 'salary',
      description: 'Oops',
      date: '2026-11-28',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['categoryId'],
      message: 'Choose an expense category',
    });
  });
});
