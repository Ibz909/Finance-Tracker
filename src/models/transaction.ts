import { z } from 'zod';
import { getCategory } from '../constants/categories';
import {
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  penceSchema,
  transactionTypeSchema,
} from './primitives';

export const DESCRIPTION_MAX_LENGTH = 100;
export const NOTES_MAX_LENGTH = 500;

/** Fields the user controls. Shared by the form and the stored record. */
const editableFields = z.object({
  type: transactionTypeSchema,
  amountPence: penceSchema,
  categoryId: z.string().min(1, 'Choose a category').max(100),
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description')
    .max(DESCRIPTION_MAX_LENGTH, `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters`),
  date: isoDateSchema,
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX_LENGTH, `Keep notes under ${NOTES_MAX_LENGTH} characters`)
    .optional(),
});

/** The category must exist and match the transaction type. */
function checkCategory(
  value: { type: 'income' | 'expense'; categoryId: string },
  ctx: z.RefinementCtx,
): void {
  if (value.categoryId === '') return; // already reported by the field's own rule
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

/** What a create/edit form submits: no IDs, timestamps or system flags. */
export const transactionDraftSchema = editableFields.superRefine(checkCategory);
export type TransactionDraft = z.infer<typeof transactionDraftSchema>;

/** A complete, stored transaction. */
export const transactionSchema = editableFields
  .extend({
    id: idSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    /** Set when generated from a recurring schedule (Phase 3). */
    recurringScheduleId: idSchema.optional(),
    /** Fictional sample data; "Clear demo data" removes only these. */
    isDemo: z.boolean(),
  })
  .superRefine(checkCategory);
export type Transaction = z.infer<typeof transactionSchema>;
