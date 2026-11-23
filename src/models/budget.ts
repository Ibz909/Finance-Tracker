import { z } from 'zod';
import { getCategory } from '../constants/categories';
import { idSchema, isoDateTimeSchema, penceSchema } from './primitives';

export const BUDGET_SCOPES = ['overall', 'category'] as const;
export const budgetScopeSchema = z.enum(BUDGET_SCOPES);
export type BudgetScope = z.infer<typeof budgetScopeSchema>;

/**
 * Budgets are standing monthly limits: "Groceries £300" applies to every
 * calendar month. The overall budget caps all spending; category budgets
 * are separate limits and are never added to it.
 */
const editableFields = z.object({
  scope: budgetScopeSchema,
  /** Required for, and only allowed on, category budgets. */
  categoryId: z.string().optional(),
  limitPence: penceSchema,
});

function checkScope(
  value: { scope: BudgetScope; categoryId?: string | undefined },
  ctx: z.RefinementCtx,
) {
  if (value.scope === 'overall') {
    if (value.categoryId !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'An overall budget has no category',
      });
    }
    return;
  }
  if (!value.categoryId) {
    ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Choose a category' });
  } else if (getCategory(value.categoryId)?.type !== 'expense') {
    ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Choose a spending category' });
  }
}

/** What the add/edit form submits. */
export const budgetDraftSchema = editableFields.superRefine(checkScope);
export type BudgetDraft = z.infer<typeof budgetDraftSchema>;

/** A stored budget. */
export const budgetSchema = editableFields
  .extend({
    id: idSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    isDemo: z.boolean(),
  })
  .superRefine(checkScope);
export type Budget = z.infer<typeof budgetSchema>;

/**
 * What a budget limits: "overall" or "category:<id>". At most one budget
 * may exist per key.
 */
export function budgetKey(budget: { scope: BudgetScope; categoryId?: string | undefined }): string {
  return budget.scope === 'overall' ? 'overall' : `category:${budget.categoryId ?? ''}`;
}
