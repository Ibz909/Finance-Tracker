import { z } from 'zod';
import type { Budget, BudgetDraft } from '../../models/budget';
import { budgetDraftSchema, budgetScopeSchema } from '../../models/budget';
import { parsePoundsToPence, penceToInputValue } from '../../utils/money';

export interface BudgetFormValues {
  scope: 'overall' | 'category';
  categoryId: string;
  /** The limit as typed, e.g. "300" or "£1,250.50". */
  limit: string;
}

/** Parses the typed limit and reuses the stored-budget rules for the rest. */
export const budgetFormSchema = z
  .object({ scope: budgetScopeSchema, categoryId: z.string(), limit: z.string() })
  .transform((values, ctx): BudgetDraft => {
    const limit = parsePoundsToPence(values.limit);
    if (!limit.ok) ctx.addIssue({ code: 'custom', path: ['limit'], message: limit.error });

    const draft = budgetDraftSchema.safeParse({
      scope: values.scope,
      limitPence: limit.ok ? limit.pence : 1,
      ...(values.scope === 'category' ? { categoryId: values.categoryId || undefined } : {}),
    });
    if (!draft.success) {
      for (const issue of draft.error.issues) {
        const field = String(issue.path[0]);
        ctx.addIssue({
          code: 'custom',
          path: [field === 'limitPence' ? 'limit' : field],
          message: issue.message,
        });
      }
    }
    return draft.success && limit.ok ? draft.data : z.NEVER;
  });

export function toBudgetFormValues(budget: Budget): BudgetFormValues {
  return {
    scope: budget.scope,
    categoryId: budget.categoryId ?? '',
    limit: penceToInputValue(budget.limitPence),
  };
}
