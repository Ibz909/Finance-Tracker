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
