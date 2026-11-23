import { useMemo } from 'react';
import { buildAddBudget, buildUpdateBudgetLimit } from '../features/budgets/budgetCommands';
import { nowIsoDateTime } from '../utils/dates';
import { useAppData, useAppDispatch } from './useAppData';

/** Validated budget operations. Returns field errors instead of throwing. */
export function useBudgetActions() {
  const dispatch = useAppDispatch();
  const { budgets } = useAppData();

  return useMemo(
    () => ({
      addBudget: (input: unknown) => {
        const result = buildAddBudget(input, budgets, {
          id: crypto.randomUUID(),
          now: nowIsoDateTime(),
        });
        if (result.ok) dispatch(result.value);
        return result;
      },
      updateBudgetLimit: (id: string, limitPence: unknown) => {
        const result = buildUpdateBudgetLimit(id, limitPence, { now: nowIsoDateTime() });
        if (result.ok) dispatch(result.value);
        return result;
      },
      deleteBudget: (id: string) => {
        dispatch({ type: 'budgetDeleted', id });
      },
    }),
    [budgets, dispatch],
  );
}
