import { z } from 'zod';
import type { AppDataAction } from '../../context/appDataReducer';
import type { Transaction } from '../../models/transaction';
import { transactionDraftSchema, transactionSchema } from '../../models/transaction';

export type CommandResult<T> =
  { ok: true; value: T } | { ok: false; fieldErrors: Partial<Record<string, string[]>> };

interface CommandContext {
  id: string;
  now: string;
}

/**
 * Pure functions that turn untrusted input into a validated action.
 * Invalid input never reaches the reducer, state or storage.
 */
export function buildAddTransaction(
  input: unknown,
  { id, now }: CommandContext,
): CommandResult<Extract<AppDataAction, { type: 'transactionAdded' }>> {
  const draft = transactionDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };

  const transaction: Transaction = transactionSchema.parse({
    ...draft.data,
    id,
    createdAt: now,
    updatedAt: now,
    isDemo: false,
  });
  return { ok: true, value: { type: 'transactionAdded', transaction } };
}

/** Turns validated import drafts into one action, with fresh IDs and timestamps. */
export function buildImportTransactions(
  drafts: readonly unknown[],
  { newId, now }: { newId: () => string; now: string },
): CommandResult<Extract<AppDataAction, { type: 'transactionsImported' }>> {
  const transactions: Transaction[] = [];
  for (const input of drafts) {
    const draft = transactionDraftSchema.safeParse(input);
    // Defence in depth: the import plan has already validated every row.
    if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };
    transactions.push(
      transactionSchema.parse({
        ...draft.data,
        id: newId(),
        createdAt: now,
        updatedAt: now,
        isDemo: false,
      }),
    );
  }
  return { ok: true, value: { type: 'transactionsImported', transactions } };
}

export function buildUpdateTransaction(
  id: string,
  input: unknown,
  { now }: Pick<CommandContext, 'now'>,
): CommandResult<Extract<AppDataAction, { type: 'transactionUpdated' }>> {
  const draft = transactionDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };
  return {
    ok: true,
    value: { type: 'transactionUpdated', id, changes: draft.data, updatedAt: now },
  };
}
