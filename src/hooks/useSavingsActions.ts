import { useMemo } from 'react';
import {
  buildAddContribution,
  buildAddGoal,
  buildDeleteContribution,
  buildUpdateGoal,
} from '../features/savings/savingsCommands';
import type { GoalContribution, SavingsGoal } from '../models/savings';
import { nowIsoDateTime } from '../utils/dates';
import { useAppData, useAppDispatch, useClock } from './useAppData';

/** Validated savings-goal operations. Returns errors instead of throwing. */
export function useSavingsActions() {
  const dispatch = useAppDispatch();
  const clock = useClock();
  const { goalContributions } = useAppData();

  return useMemo(() => {
    const now = () => nowIsoDateTime(clock());
    return {
      addGoal: (input: unknown) => {
        const result = buildAddGoal(input, { id: crypto.randomUUID(), now: now() });
        if (result.ok) dispatch(result.value);
        return result;
      },
      updateGoal: (id: string, input: unknown) => {
        const result = buildUpdateGoal(id, input, { now: now() });
        if (result.ok) dispatch(result.value);
        return result;
      },
      deleteGoal: (id: string) => {
        dispatch({ type: 'goalDeleted', id });
      },
      addContribution: (goal: SavingsGoal, input: unknown) => {
        const result = buildAddContribution(goal, input, goalContributions, {
          id: crypto.randomUUID(),
          now: now(),
        });
        if (result.ok) dispatch(result.value);
        return result;
      },
      deleteContribution: (contribution: GoalContribution) => {
        const result = buildDeleteContribution(contribution, goalContributions);
        if (result.ok) dispatch(result.value);
        return result;
      },
    };
  }, [clock, dispatch, goalContributions]);
}
