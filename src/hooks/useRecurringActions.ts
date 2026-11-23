import { useMemo } from 'react';
import { buildAddSchedule, buildUpdateSchedule } from '../features/recurring/recurringCommands';
import type { RecurringSchedule } from '../models/recurring';
import { nowIsoDateTime, todayIsoDate } from '../utils/dates';
import { useAppDispatch, useClock } from './useAppData';

/** Validated recurring-schedule operations. Returns field errors instead of throwing. */
export function useRecurringActions() {
  const dispatch = useAppDispatch();
  const clock = useClock();

  return useMemo(() => {
    const time = () => {
      const date = clock();
      return { today: todayIsoDate(date), now: nowIsoDateTime(date) };
    };
    return {
      addSchedule: (input: unknown) => {
        const result = buildAddSchedule(input, { id: crypto.randomUUID(), ...time() });
        if (result.ok) dispatch(result.value);
        return result;
      },
      updateSchedule: (current: RecurringSchedule, input: unknown) => {
        const result = buildUpdateSchedule(current, input, time());
        if (result.ok) dispatch(result.value);
        return result;
      },
      setPaused: (id: string, paused: boolean) => {
        dispatch({ type: 'recurringSchedulePaused', id, paused, ...time() });
      },
      deleteSchedule: (id: string) => {
        dispatch({ type: 'recurringScheduleDeleted', id });
      },
    };
  }, [clock, dispatch]);
}
