import { useMemo } from 'react';
import { generateDemoBudgets, generateDemoTransactions } from '../features/demo/demoData';
import { useAppDispatch } from './useAppData';

/** Loading replaces earlier demo data (no duplicates); clearing removes only demo data. */
export function useDemoDataActions() {
  const dispatch = useAppDispatch();

  return useMemo(
    () => ({
      loadDemoData: () => {
        const now = new Date();
        dispatch({
          type: 'demoDataLoaded',
          transactions: generateDemoTransactions(now),
          budgets: generateDemoBudgets(now),
        });
      },
      clearDemoData: () => {
        dispatch({ type: 'demoDataCleared' });
      },
    }),
    [dispatch],
  );
}
