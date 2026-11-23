import { describe, expect, it } from 'vitest';
import { makeTransaction } from '../../test/fixtures';
import type { TransactionFormValues } from './transactionFormSchema';
import { emptyFormValues, toFormValues, transactionFormSchema } from './transactionFormSchema';

const valid: TransactionFormValues = {
  type: 'expense',
  amount: '£1,234.50',
  categoryId: 'shopping',
  description: '  New coat  ',
  date: '2026-11-20',
  notes: '',
};

/** Every message per field, so a test fails if a field gets two competing errors. */
function errorsFor(values: TransactionFormValues) {
  const result = transactionFormSchema.safeParse(values);
  const errors: Record<string, string[]> = {};
  if (result.success) return errors;
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    (errors[field] ??= []).push(issue.message);
  }
  return errors;
}

describe('transactionFormSchema', () => {
  it('converts valid form values into a draft in pence', () => {
    expect(transactionFormSchema.parse(valid)).toEqual({
      type: 'expense',
      amountPence: 123450,
      categoryId: 'shopping',
      description: 'New coat',
      date: '2026-11-20',
    });
  });

  it('keeps notes when provided and drops blank ones', () => {
    expect(transactionFormSchema.parse({ ...valid, notes: ' Sale ' }).notes).toBe('Sale');
    expect(transactionFormSchema.parse({ ...valid, notes: '   ' })).not.toHaveProperty('notes');
  });

  it('reports every problem at once, on the field the user sees', () => {
    expect(
      errorsFor({ ...valid, amount: '12.345', categoryId: '', description: ' ', date: '' }),
    ).toEqual({
      amount: ['Use no more than two decimal places'],
      categoryId: ['Choose a category'],
      description: ['Enter a description'],
      date: ['Enter a valid date'],
    });
  });

  it('rejects a zero amount', () => {
    expect(errorsFor({ ...valid, amount: '0' })).toEqual({
      amount: ['Enter an amount greater than zero'],
    });
  });

  it('rejects a category from the other type', () => {
    expect(errorsFor({ ...valid, categoryId: 'salary' })).toEqual({
      categoryId: ['Choose an expense category'],
    });
  });
});

describe('form value helpers', () => {
  it('starts a new form as an expense dated today', () => {
    expect(emptyFormValues('2026-11-23')).toMatchObject({ type: 'expense', date: '2026-11-23' });
  });

  it('round-trips a stored transaction through the form unchanged', () => {
    const transaction = makeTransaction({ amountPence: 4599, notes: 'Receipt in drawer' });
    const { id: _id, createdAt: _c, updatedAt: _u, isDemo: _d, ...draft } = transaction;

    expect(transactionFormSchema.parse(toFormValues(transaction))).toEqual(draft);
  });
});
