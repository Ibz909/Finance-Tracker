import { z } from 'zod';
import { getCategory } from '../../constants/categories';
import type { AppDataAction } from '../../context/appDataReducer';
import type { Budget } from '../../models/budget';
import { budgetDraftSchema, budgetKey, budgetSchema } from '../../models/budget';
import { penceSchema } from '../../models/primitives';
import type { CommandResult } from '../transactions/transactionCommands';

/**
 * Validates a new budget and checks it doesn't duplicate an existing one:
 * there can be one overall budget and one budget per category.
 */
export function buildAddBudget(
  input: unknown,
  existing: readonly Budget[],
  { id, now }: { id: string; now: string },
): CommandResult<Extract<AppDataAction, { type: 'budgetAdded' }>> {
  const draft = budgetDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };

  const key = budgetKey(draft.data);
  if (existing.some((b) => budgetKey(b) === key)) {
    return draft.data.scope === 'overall'
      ? { ok: false, fieldErrors: { scope: ['You already have an overall monthly budget'] } }
      : {
          ok: false,
          fieldErrors: {
            categoryId: [
              `${getCategory(draft.data.categoryId ?? '')?.label ?? 'This category'} already has a budget`,
            ],
          },
        };
  }

  const budget = budgetSchema.parse({
    ...draft.data,
    id,
    createdAt: now,
    updatedAt: now,
    isDemo: false,
  });
  return { ok: true, value: { type: 'budgetAdded', budget } };
}

export function buildUpdateBudgetLimit(
  id: string,
  limitPence: unknown,
  { now }: { now: string },
): CommandResult<Extract<AppDataAction, { type: 'budgetUpdated' }>> {
  const limit = penceSchema.safeParse(limitPence);
  if (!limit.success) {
    return { ok: false, fieldErrors: { limitPence: limit.error.issues.map((i) => i.message) } };
  }
  return {
    ok: true,
    value: { type: 'budgetUpdated', id, limitPence: limit.data, updatedAt: now },
  };
}
