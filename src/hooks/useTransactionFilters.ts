import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
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

  /*
   * The most recent parameters we have written. React Router's functional
   * setSearchParams builds on the URL from the *last render*, so changes
   * arriving before the page re-renders (fast typing, several controls at
   * once) each started from the same old URL and overwrote one another.
   * Building on this ref chains them correctly. It is re-synced whenever
   * the URL changes for any other reason, such as Back or a link.
   */
  const latestParams = useRef(searchParams);
  useLayoutEffect(() => {
    latestParams.current = searchParams;
  }, [searchParams]);

  const write = useCallback(
    (next: URLSearchParams) => {
      latestParams.current = next;
      setSearchParams(next, { replace: true });
    },
    [setSearchParams],
  );

  const updateFilters = useCallback(
    (changes: Partial<TransactionFilters>) => {
      const current = latestParams.current;
      write(writeFilters(current, applyFilterChange(parseFilters(current), changes)));
    },
    [write],
  );

  /** Clears every filter (custom dates included) but keeps the month and the sort order. */
  const resetFilters = useCallback(() => {
    const current = parseFilters(latestParams.current);
    write(
      writeFilters(latestParams.current, {
        ...DEFAULT_FILTERS,
        month: current.month,
        sort: current.sort,
      }),
    );
  }, [write]);

  return { filters, updateFilters, resetFilters };
}
