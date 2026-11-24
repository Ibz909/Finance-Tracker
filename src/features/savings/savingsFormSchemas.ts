import { z } from 'zod';
import type { ContributionDraft, GoalDraft, SavingsGoal } from '../../models/savings';
import {
  contributionDraftSchema,
  contributionKindSchema,
  goalDraftSchema,
} from '../../models/savings';
import { parsePoundsToPence, penceToInputValue } from '../../utils/money';

/** Copies stored-schema issues onto form fields, mapping pence fields to typed ones. */
function reportIssues(
  issues: readonly z.core.$ZodIssue[],
  ctx: z.RefinementCtx,
  fieldFor: Record<string, string>,
) {
  for (const issue of issues) {
    const field = String(issue.path[0]);
    ctx.addIssue({ code: 'custom', path: [fieldFor[field] ?? field], message: issue.message });
  }
}

export interface GoalFormValues {
  name: string;
  /** As typed, e.g. "3,000". */
  target: string;
  /** Blank means no target date. */
  targetDate: string;
}

export const goalFormSchema = z
  .object({ name: z.string(), target: z.string(), targetDate: z.string() })
  .transform((values, ctx): GoalDraft => {
    const target = parsePoundsToPence(values.target);
    if (!target.ok) ctx.addIssue({ code: 'custom', path: ['target'], message: target.error });

    const draft = goalDraftSchema.safeParse({
      name: values.name,
      targetPence: target.ok ? target.pence : 1,
      ...(values.targetDate === '' ? {} : { targetDate: values.targetDate }),
    });
    if (!draft.success) reportIssues(draft.error.issues, ctx, { targetPence: 'target' });
    return draft.success && target.ok ? draft.data : z.NEVER;
  });

export function toGoalFormValues(goal: SavingsGoal | undefined): GoalFormValues {
  return goal
    ? {
        name: goal.name,
        target: penceToInputValue(goal.targetPence),
        targetDate: goal.targetDate ?? '',
      }
    : { name: '', target: '', targetDate: '' };
}

export interface ContributionFormValues {
  kind: 'deposit' | 'withdrawal';
  amount: string;
  date: string;
  note: string;
}

export const contributionFormSchema = z
  .object({ kind: contributionKindSchema, amount: z.string(), date: z.string(), note: z.string() })
  .transform((values, ctx): ContributionDraft => {
    const amount = parsePoundsToPence(values.amount);
    if (!amount.ok) ctx.addIssue({ code: 'custom', path: ['amount'], message: amount.error });

    const draft = contributionDraftSchema.safeParse({
      kind: values.kind,
      amountPence: amount.ok ? amount.pence : 1,
      date: values.date,
      ...(values.note.trim() === '' ? {} : { note: values.note }),
    });
    if (!draft.success) reportIssues(draft.error.issues, ctx, { amountPence: 'amount' });
    return draft.success && amount.ok ? draft.data : z.NEVER;
  });
