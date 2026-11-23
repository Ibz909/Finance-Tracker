import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { TransactionFilters } from '../features/transactions/transactionFilters';
import {
  applyFilterChange,
  DEFAULT_FILTERS,
  parseFilters,
  writeFilters,
} from '../features/transactions/transactionFilters';

/**
 * Transaction filters kept in the URL, so a filtered view survives a
 * refresh and can be bookmarked.
 *
 * Changes *replace* the current history entry instead of adding one:
 * otherwise typing "groceries" would leave nine steps for the Back button.
 * Back therefore returns to the previous page, not the previous keystroke.
 */
export function useTransactionFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const updateFilters = useCallback(
    (changes: Partial<TransactionFilters>) => {
      setSearchParams(
        (previous) => writeFilters(previous, applyFilterChange(parseFilters(previous), changes)),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Clears every filter but keeps the chosen sort order. */
  const resetFilters = useCallback(() => {
    setSearchParams(
      (previous) =>
        writeFilters(previous, { ...DEFAULT_FILTERS, sort: parseFilters(previous).sort }),
      { replace: true },
    );
  }, [setSearchParams]);

  return { filters, updateFilters, resetFilters };
}
