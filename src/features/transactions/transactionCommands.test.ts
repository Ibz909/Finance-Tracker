import { describe, expect, it } from 'vitest';
import {
  buildAddTransaction,
  buildImportTransactions,
  buildUpdateTransaction,
} from './transactionCommands';

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

describe('buildImportTransactions', () => {
  it('creates one action with a fresh ID and shared timestamp per row', () => {
    let n = 0;
    const result = buildImportTransactions([validInput, { ...validInput, amountPence: 100 }], {
      newId: () => `imported-${String(++n)}`,
      now: NOW,
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        type: 'transactionsImported',
        transactions: [
          { id: 'imported-1', description: 'Train to Leeds', createdAt: NOW, isDemo: false },
          { id: 'imported-2', amountPence: 100 },
        ],
      },
    });
  });

  it('rejects the whole batch if any row is invalid', () => {
    const result = buildImportTransactions([validInput, { ...validInput, amountPence: 0 }], {
      newId: () => 'x',
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});
