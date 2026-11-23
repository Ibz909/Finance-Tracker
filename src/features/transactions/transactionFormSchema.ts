import { z } from 'zod';
import { transactionTypeSchema } from '../../models/primitives';
import type { Transaction, TransactionDraft } from '../../models/transaction';
import { transactionDraftSchema } from '../../models/transaction';
import { parsePoundsToPence, penceToInputValue } from '../../utils/money';

/**
 * What the form holds while the user types. Everything is a string (that is
 * what inputs produce); the amount stays as typed, e.g. "12.50".
 */
export interface TransactionFormValues {
  type: 'income' | 'expense';
  amount: string;
  categoryId: string;
  description: string;
  date: string;
  notes: string;
}

/** Maps the stored field name to the form field that shows its error. */
const FORM_FIELD_FOR: Partial<Record<string, keyof TransactionFormValues>> = {
  amountPence: 'amount',
};

/**
 * Validates form values and converts them into a TransactionDraft.
 *
 * Reuses transactionDraftSchema so the form enforces exactly the same rules
 * as storage; the only form-specific step is parsing the amount text.
 */
export const transactionFormSchema = z
  .object({
    type: transactionTypeSchema,
    amount: z.string(),
    categoryId: z.string(),
    description: z.string(),
    date: z.string(),
    notes: z.string(),
  })
  .transform((values, ctx): TransactionDraft => {
    const amount = parsePoundsToPence(values.amount);
    if (!amount.ok) ctx.addIssue({ code: 'custom', path: ['amount'], message: amount.error });

    const draft = transactionDraftSchema.safeParse({
      type: values.type,
      // A placeholder keeps other fields' errors visible while the amount is invalid.
      amountPence: amount.ok ? amount.pence : 1,
      categoryId: values.categoryId,
      description: values.description,
      date: values.date,
      // Leave the key out entirely when blank, so no `notes: undefined` is stored.
      ...(values.notes.trim() === '' ? {} : { notes: values.notes }),
    });

    if (!draft.success) {
      for (const issue of draft.error.issues) {
        const field = String(issue.path[0]);
        ctx.addIssue({
          code: 'custom',
          path: [FORM_FIELD_FOR[field] ?? field],
          message: issue.message,
        });
      }
    }
    return draft.success && amount.ok ? draft.data : z.NEVER;
  });

export function emptyFormValues(today: string): TransactionFormValues {
  return { type: 'expense', amount: '', categoryId: '', description: '', date: today, notes: '' };
}

export function toFormValues(transaction: Transaction): TransactionFormValues {
  return {
    type: transaction.type,
    amount: penceToInputValue(transaction.amountPence),
    categoryId: transaction.categoryId,
    description: transaction.description,
    date: transaction.date,
    notes: transaction.notes ?? '',
  };
}
