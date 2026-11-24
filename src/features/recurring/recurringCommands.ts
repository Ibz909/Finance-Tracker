import { subMonths } from 'date-fns';
import { z } from 'zod';
import type { AppDataAction } from '../../context/appDataReducer';
import type { RecurringSchedule } from '../../models/recurring';
import { recurringDraftSchema, recurringScheduleSchema } from '../../models/recurring';
import type { IsoDate } from '../../utils/dates';
import { parseIsoDate, toIsoDate } from '../../utils/dates';
import type { CommandResult } from '../transactions/transactionCommands';

/**
 * How far back a new schedule may start. Past payments are added straight
 * away, so this stops one form submission creating years of transactions.
 * Older history belongs in a CSV import.
 */
export const MAX_BACKDATE_MONTHS = 12;

export function earliestStartDate(today: IsoDate): IsoDate {
  return toIsoDate(subMonths(parseIsoDate(today), MAX_BACKDATE_MONTHS));
}

export const START_TOO_EARLY_MESSAGE = `The start date can be at most ${String(MAX_BACKDATE_MONTHS)} months ago`;

interface Clock {
  today: IsoDate;
  now: string;
}

export function buildAddSchedule(
  input: unknown,
  { id, today, now }: Clock & { id: string },
): CommandResult<Extract<AppDataAction, { type: 'recurringScheduleAdded' }>> {
  const draft = recurringDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };
  if (draft.data.startDate < earliestStartDate(today)) {
    return { ok: false, fieldErrors: { startDate: [START_TOO_EARLY_MESSAGE] } };
  }

  const schedule: RecurringSchedule = recurringScheduleSchema.parse({
    ...draft.data,
    id,
    // Catch-up in the reducer adds any payments already due and moves this on.
    nextDueDate: draft.data.startDate,
    paused: false,
    createdAt: now,
    updatedAt: now,
    isDemo: false,
  });
  return { ok: true, value: { type: 'recurringScheduleAdded', schedule, today, now } };
}

export function buildUpdateSchedule(
  current: RecurringSchedule,
  input: unknown,
  { today, now }: Clock,
): CommandResult<Extract<AppDataAction, { type: 'recurringScheduleUpdated' }>> {
  const draft = recurringDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };
  // Only a *changed* start date is checked: an old schedule stays editable.
  if (
    draft.data.startDate !== current.startDate &&
    draft.data.startDate < earliestStartDate(today)
  ) {
    return { ok: false, fieldErrors: { startDate: [START_TOO_EARLY_MESSAGE] } };
  }
  return {
    ok: true,
    value: { type: 'recurringScheduleUpdated', id: current.id, changes: draft.data, today, now },
  };
}
