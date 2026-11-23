import { useMemo } from 'react';
import { generateDemoTransactions } from '../features/demo/demoData';
import { useAppDispatch } from './useAppData';

/** Loading replaces earlier demo data (no duplicates); clearing removes only demo data. */
export function useDemoDataActions() {
  const dispatch = useAppDispatch();

  return useMemo(
    () => ({
      loadDemoData: () => {
        dispatch({ type: 'demoDataLoaded', transactions: generateDemoTransactions() });
      },
      clearDemoData: () => {
        dispatch({ type: 'demoDataCleared' });
      },
    }),
    [dispatch],
  );
}
