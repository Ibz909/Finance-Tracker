import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useAppData, useStorageStatus } from '../hooks/useAppData';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { createEmptyAppData } from '../models/appData';
import type { DataRepository } from '../services/storage/DataRepository';
import { createLocalStorageRepository } from '../services/storage/localStorageRepository';
import { createMemoryRepository } from '../services/storage/memoryRepository';
import { makeTransaction } from '../test/fixtures';
import { AppDataProvider } from './AppDataProvider';

const draft = {
  type: 'expense',
  amountPence: 1999,
  categoryId: 'subscriptions',
  description: 'Music streaming',
  date: '2026-11-01',
};

function renderData(repository: DataRepository) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppDataProvider repository={repository}>{children}</AppDataProvider>
  );
  return renderHook(
    () => ({ data: useAppData(), actions: useTransactionActions(), status: useStorageStatus() }),
    { wrapper },
  );
}

describe('AppDataProvider', () => {
  it('starts with whatever the repository loads', () => {
    const existing = makeTransaction();
    const { result } = renderData(
      createMemoryRepository({ ...createEmptyAppData(), transactions: [existing] }),
    );

    expect(result.current.data.transactions).toEqual([existing]);
  });

  it('does not save on start-up', () => {
    const repository = createMemoryRepository();
    renderData(repository);

    expect(repository.saved).toBeUndefined();
  });

  it('adds, updates and deletes transactions, saving after each change', () => {
    const repository = createMemoryRepository();
    const { result } = renderData(repository);

    act(() => {
      result.current.actions.addTransaction(draft);
    });
    const [added] = result.current.data.transactions;
    expect(added).toMatchObject({ ...draft, isDemo: false });
    expect(repository.saved?.transactions).toEqual([added]);

    act(() => {
      result.current.actions.updateTransaction(added?.id ?? '', { ...draft, amountPence: 2199 });
    });
    expect(result.current.data.transactions[0]?.amountPence).toBe(2199);
    expect(repository.saved?.transactions[0]?.amountPence).toBe(2199);

    act(() => {
      result.current.actions.deleteTransaction(added?.id ?? '');
    });
    expect(result.current.data.transactions).toEqual([]);
    expect(repository.saved?.transactions).toEqual([]);
  });

  it('keeps invalid input out of state and storage', () => {
    const repository = createMemoryRepository();
    const { result } = renderData(repository);

    let outcome: ReturnType<typeof result.current.actions.addTransaction> | undefined;
    act(() => {
      outcome = result.current.actions.addTransaction({ ...draft, amountPence: -1 });
    });

    expect(outcome?.ok).toBe(false);
    expect(result.current.data.transactions).toEqual([]);
    expect(repository.saved).toBeUndefined();
  });

  it('applies several changes in one event without losing any', () => {
    const { result } = renderData(createMemoryRepository());

    act(() => {
      result.current.actions.addTransaction(draft);
      result.current.actions.addTransaction({ ...draft, description: 'Second' });
    });

    expect(result.current.data.transactions).toHaveLength(2);
  });

  it('keeps data after a browser refresh (remount with localStorage)', () => {
    const first = renderData(createLocalStorageRepository());
    act(() => {
      first.result.current.actions.addTransaction(draft);
    });
    first.unmount();

    const second = renderData(createLocalStorageRepository());

    expect(second.result.current.data.transactions).toEqual(first.result.current.data.transactions);
  });

  it('reports a failed save and clears it after the next success', () => {
    let failNext = true;
    const memory = createMemoryRepository();
    const flaky: DataRepository = {
      load: () => memory.load(),
      save: (data) => {
        if (failNext) return { ok: false, error: 'Browser storage is full.' };
        return memory.save(data);
      },
      clearBackups: () => memory.clearBackups(),
    };
    const { result } = renderData(flaky);

    act(() => {
      result.current.actions.addTransaction(draft);
    });
    expect(result.current.status.saveError).toBe('Browser storage is full.');

    failNext = false;
    act(() => {
      result.current.actions.addTransaction(draft);
    });
    expect(result.current.status.saveError).toBeNull();
  });

  it('exposes a recovered load until dismissed', () => {
    const repository: DataRepository = {
      load: () => ({
        status: 'recovered',
        data: createEmptyAppData(),
        problem: 'Saved data could not be read.',
        skippedRecords: 0,
        backupKey: 'backup-1',
      }),
      save: () => ({ ok: true }),
      clearBackups: () => ({ ok: true }),
    };
    const { result } = renderData(repository);

    expect(result.current.status.load).toEqual({
      status: 'recovered',
      problem: 'Saved data could not be read.',
      backupKey: 'backup-1',
    });

    act(() => {
      result.current.status.dismissLoadProblem();
    });
    expect(result.current.status.load.status).toBe('ok');
  });
});
