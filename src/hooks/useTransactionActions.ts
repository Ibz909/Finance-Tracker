import { useMemo } from 'react';
import {
  buildAddTransaction,
  buildImportTransactions,
  buildUpdateTransaction,
} from '../features/transactions/transactionCommands';
import { nowIsoDateTime } from '../utils/dates';
import { useAppDispatch } from './useAppData';

/**
 * Validated transaction operations for components. Returns field errors
 * for invalid input instead of throwing.
 */
export function useTransactionActions() {
  const dispatch = useAppDispatch();

  return useMemo(
    () => ({
      addTransaction: (input: unknown) => {
        const result = buildAddTransaction(input, {
          id: crypto.randomUUID(),
          now: nowIsoDateTime(),
        });
        if (result.ok) dispatch(result.value);
        return result;
      },
      updateTransaction: (id: string, input: unknown) => {
        const result = buildUpdateTransaction(id, input, { now: nowIsoDateTime() });
        if (result.ok) dispatch(result.value);
        return result;
      },
      importTransactions: (drafts: readonly unknown[]) => {
        const result = buildImportTransactions(drafts, {
          newId: () => crypto.randomUUID(),
          now: nowIsoDateTime(),
        });
        if (result.ok) dispatch(result.value);
        return result;
      },
      deleteTransaction: (id: string) => {
        dispatch({ type: 'transactionDeleted', id });
      },
    }),
    [dispatch],
  );
}
