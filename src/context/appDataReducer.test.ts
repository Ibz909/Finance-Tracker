import { describe, expect, it } from 'vitest';
import type { AppData } from '../models/appData';
import { createEmptyAppData } from '../models/appData';
import type { TransactionDraft } from '../models/transaction';
import { makeTransaction } from '../test/fixtures';
import { appDataReducer } from './appDataReducer';

function stateWith(...transactions: AppData['transactions']): AppData {
  return { ...createEmptyAppData(), transactions };
}

const changes: TransactionDraft = {
  type: 'income',
  amountPence: 300000,
  categoryId: 'salary',
  description: 'Salary',
  date: '2026-03-28',
};

describe('appDataReducer', () => {
  it('adds a transaction without mutating the previous state', () => {
    const before = stateWith();
    const transaction = makeTransaction();

    const after = appDataReducer(before, { type: 'transactionAdded', transaction });

    expect(after.transactions).toEqual([transaction]);
    expect(before.transactions).toEqual([]);
  });

  it('updates editable fields but keeps id, createdAt, isDemo and the recurring link', () => {
    const original = makeTransaction({ isDemo: true, recurringScheduleId: 'sched-1' });

    const after = appDataReducer(stateWith(original), {
      type: 'transactionUpdated',
      id: original.id,
      changes,
      updatedAt: '2026-04-01T09:00:00.000Z',
    });

    expect(after.transactions[0]).toEqual({
      ...changes,
      id: original.id,
      createdAt: original.createdAt,
      updatedAt: '2026-04-01T09:00:00.000Z',
      isDemo: true,
      recurringScheduleId: 'sched-1',
    });
  });

  it('removes notes when an edit clears them', () => {
    const original = makeTransaction({ notes: 'Old note' });

    const after = appDataReducer(stateWith(original), {
      type: 'transactionUpdated',
      id: original.id,
      changes: { ...changes, notes: '' },
      updatedAt: '2026-04-01T09:00:00.000Z',
    });

    expect(after.transactions[0]).not.toHaveProperty('notes');
  });

  it('deletes only the matching transaction', () => {
    const keep = makeTransaction();
    const remove = makeTransaction();

    const after = appDataReducer(stateWith(keep, remove), {
      type: 'transactionDeleted',
      id: remove.id,
    });

    expect(after.transactions).toEqual([keep]);
  });

  it('returns the same state object when an update or delete matches nothing', () => {
    const before = stateWith(makeTransaction());

    expect(appDataReducer(before, { type: 'transactionDeleted', id: 'missing' })).toBe(before);
    expect(
      appDataReducer(before, {
        type: 'transactionUpdated',
        id: 'missing',
        changes,
        updatedAt: '2026-04-01T09:00:00.000Z',
      }),
    ).toBe(before);
  });

  it('resets to empty data', () => {
    expect(appDataReducer(stateWith(makeTransaction()), { type: 'dataReset' })).toEqual(
      createEmptyAppData(),
    );
  });
});

describe('demo data actions', () => {
  const real = makeTransaction({ id: 'real-1', isDemo: false, description: 'My rent' });
  const oldDemo = makeTransaction({ id: 'demo-old', isDemo: true });
  const newDemo = [
    makeTransaction({ id: 'demo-a', isDemo: true }),
    makeTransaction({ id: 'demo-b', isDemo: true }),
  ];

  it('adds demo data alongside real data without changing it', () => {
    const after = appDataReducer(stateWith(real), {
      type: 'demoDataLoaded',
      transactions: newDemo,
    });

    expect(after.transactions).toEqual([real, ...newDemo]);
  });

  it('replaces earlier demo data instead of duplicating it', () => {
    const after = appDataReducer(stateWith(real, oldDemo), {
      type: 'demoDataLoaded',
      transactions: newDemo,
    });

    expect(after.transactions.map((t) => t.id)).toEqual(['real-1', 'demo-a', 'demo-b']);
  });

  it('clears only demo records, keeping real ones exactly as they were', () => {
    const after = appDataReducer(stateWith(oldDemo, real, ...newDemo), {
      type: 'demoDataCleared',
    });

    expect(after.transactions).toEqual([real]);
  });

  it('keeps the same state object when there is no demo data to clear', () => {
    const before = stateWith(real);
    expect(appDataReducer(before, { type: 'demoDataCleared' })).toBe(before);
  });
});
