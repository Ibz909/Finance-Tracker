import { z } from 'zod';
import { getCategory } from '../constants/categories';
import { DESCRIPTION_MAX_LENGTH, NOTES_MAX_LENGTH } from './transaction';
import {
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  penceSchema,
  transactionTypeSchema,
} from './primitives';

export const FREQUENCIES = ['weekly', 'fortnightly', 'monthly', 'yearly'] as const;
export const frequencySchema = z.enum(FREQUENCIES);
export type Frequency = z.infer<typeof frequencySchema>;

/**
 * Fields the user controls. They mirror a transaction's, plus when and how
 * often it repeats. The schedule is a *rule*: each time a payment falls
 * due, an ordinary transaction is created from it.
 */
const editableFields = z.object({
  type: transactionTypeSchema,
  amountPence: penceSchema,
  categoryId: z.string().min(1, 'Choose a category').max(100),
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description')
    .max(DESCRIPTION_MAX_LENGTH, `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters`),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX_LENGTH, `Keep notes under ${NOTES_MAX_LENGTH} characters`)
    .optional(),
  frequency: frequencySchema,
  /** The first payment date. Later dates are always worked out from this one. */
  startDate: isoDateSchema,
  /** Optional last day a payment can fall on (inclusive). */
  endDate: isoDateSchema.optional(),
});

function checkRules(
  value: {
    type: 'income' | 'expense';
    categoryId: string;
    startDate: string;
    endDate?: string | undefined;
  },
  ctx: z.RefinementCtx,
): void {
  if (value.categoryId !== '') {
    const category = getCategory(value.categoryId);
    if (!category) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Choose a category' });
    } else if (category.type !== value.type) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: `Choose an ${value.type} category`,
      });
    }
  }
  if (value.endDate !== undefined && value.endDate < value.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'The end date can’t be before the start date',
    });
  }
}

/** What the add/edit form submits. */
export const recurringDraftSchema = editableFields.superRefine(checkRules);
export type RecurringDraft = z.infer<typeof recurringDraftSchema>;

/** A stored recurring schedule. */
export const recurringScheduleSchema = editableFields
  .extend({
    id: idSchema,
    /**
     * The next payment date not yet added as a transaction, or null once
     * the schedule has ended. It only ever moves forward, so a payment the
     * user deletes is never added again.
     */
    nextDueDate: isoDateSchema.nullable(),
    /** Paused schedules add nothing; resuming skips the missed payments. */
    paused: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    isDemo: z.boolean(),
  })
  .superRefine(checkRules);
export type RecurringSchedule = z.infer<typeof recurringScheduleSchema>;
