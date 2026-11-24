import { z } from 'zod';
import type { RecurringDraft, RecurringSchedule } from '../../models/recurring';
import { frequencySchema, recurringDraftSchema } from '../../models/recurring';
import { transactionTypeSchema } from '../../models/primitives';
import { parsePoundsToPence, penceToInputValue } from '../../utils/money';

/** What the form holds while the user types: every input produces a string. */
export interface RecurringFormValues {
  type: 'income' | 'expense';
  amount: string;
  categoryId: string;
  description: string;
  frequency: RecurringDraft['frequency'];
  startDate: string;
  /** Blank means "no end date". */
  endDate: string;
  notes: string;
}

/**
 * Converts form values into a RecurringDraft, reusing the stored-schedule
 * rules. The only form-specific steps are parsing the amount and treating
 * blank optional fields as "not set".
 */
export const recurringFormSchema = z
  .object({
    type: transactionTypeSchema,
    amount: z.string(),
    categoryId: z.string(),
    description: z.string(),
    frequency: frequencySchema,
    startDate: z.string(),
    endDate: z.string(),
    notes: z.string(),
  })
  .transform((values, ctx): RecurringDraft => {
    const amount = parsePoundsToPence(values.amount);
    if (!amount.ok) ctx.addIssue({ code: 'custom', path: ['amount'], message: amount.error });

    const draft = recurringDraftSchema.safeParse({
      type: values.type,
      amountPence: amount.ok ? amount.pence : 1,
      categoryId: values.categoryId,
      description: values.description,
      frequency: values.frequency,
      startDate: values.startDate,
      ...(values.endDate === '' ? {} : { endDate: values.endDate }),
      ...(values.notes.trim() === '' ? {} : { notes: values.notes }),
    });
    if (!draft.success) {
      for (const issue of draft.error.issues) {
        const field = String(issue.path[0]);
        ctx.addIssue({
          code: 'custom',
          path: [field === 'amountPence' ? 'amount' : field],
          message: issue.message,
        });
      }
    }
    return draft.success && amount.ok ? draft.data : z.NEVER;
  });

export function emptyRecurringValues(today: string): RecurringFormValues {
  return {
    type: 'expense',
    amount: '',
    categoryId: '',
    description: '',
    frequency: 'monthly',
    startDate: today,
    endDate: '',
    notes: '',
  };
}

export function toRecurringFormValues(schedule: RecurringSchedule): RecurringFormValues {
  return {
    type: schedule.type,
    amount: penceToInputValue(schedule.amountPence),
    categoryId: schedule.categoryId,
    description: schedule.description,
    frequency: schedule.frequency,
    startDate: schedule.startDate,
    endDate: schedule.endDate ?? '',
    notes: schedule.notes ?? '',
  };
}
