import { describe, expect, it } from 'vitest';
import { buildAddTransaction, buildUpdateTransaction } from './transactionCommands';

const NOW = '2026-11-23T10:00:00.000Z';
const validInput = {
  type: 'expense',
  amountPence: 4599,
  categoryId: 'transport',
  description: '  Train to Leeds  ',
  date: '2026-11-20',
};

describe('buildAddTransaction', () => {
  it('creates a complete, real (non-demo) transaction from valid input', () => {
    const result = buildAddTransaction(validInput, { id: 'abc', now: NOW });

    expect(result).toEqual({
      ok: true,
      value: {
        type: 'transactionAdded',
        transaction: {
          ...validInput,
          description: 'Train to Leeds',
          id: 'abc',
          createdAt: NOW,
          updatedAt: NOW,
          isDemo: false,
        },
      },
    });
  });

  it('ignores attempts to set system fields from input', () => {
    const result = buildAddTransaction(
      { ...validInput, id: 'evil', isDemo: true, createdAt: '2000-01-01T00:00:00.000Z' },
      { id: 'abc', now: NOW },
    );

    expect(result.ok && result.value.transaction).toMatchObject({
      id: 'abc',
      isDemo: false,
      createdAt: NOW,
    });
  });

  it('returns field errors for invalid input', () => {
    const result = buildAddTransaction(
      { ...validInput, amountPence: 0, description: '', categoryId: 'salary' },
      { id: 'abc', now: NOW },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual([
        'amountPence',
        'categoryId',
        'description',
      ]);
    }
  });
});

describe('buildUpdateTransaction', () => {
  it('builds an update action with the new timestamp', () => {
    expect(buildUpdateTransaction('abc', validInput, { now: NOW })).toMatchObject({
      ok: true,
      value: { type: 'transactionUpdated', id: 'abc', updatedAt: NOW },
    });
  });

  it('rejects invalid changes', () => {
    expect(
      buildUpdateTransaction('abc', { ...validInput, date: '2026-02-30' }, { now: NOW }),
    ).toMatchObject({ ok: false, fieldErrors: { date: ['Enter a valid date'] } });
  });
});
