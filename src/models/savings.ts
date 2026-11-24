import { z } from 'zod';
import { idSchema, isoDateSchema, isoDateTimeSchema, penceSchema } from './primitives';

export const GOAL_NAME_MAX_LENGTH = 60;
export const CONTRIBUTION_NOTE_MAX_LENGTH = 200;

/**
 * A savings goal, such as an emergency fund or a holiday. How much has been
 * saved is never stored: it is worked out from the goal's contributions.
 */
const goalFields = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name for the goal')
    .max(GOAL_NAME_MAX_LENGTH, `Keep the name under ${String(GOAL_NAME_MAX_LENGTH)} characters`),
  targetPence: penceSchema,
  /** Optional date to reach the target by. */
  targetDate: isoDateSchema.optional(),
});

export const goalDraftSchema = goalFields;
export type GoalDraft = z.infer<typeof goalDraftSchema>;

export const savingsGoalSchema = goalFields.extend({
  id: idSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  isDemo: z.boolean(),
});
export type SavingsGoal = z.infer<typeof savingsGoalSchema>;

export const CONTRIBUTION_KINDS = ['deposit', 'withdrawal'] as const;
export const contributionKindSchema = z.enum(CONTRIBUTION_KINDS);
export type ContributionKind = z.infer<typeof contributionKindSchema>;

/**
 * Money moved into or out of a goal. Kept apart from transactions on
 * purpose: setting money aside is not spending it, so it must not count
 * towards expenses, budgets or charts.
 */
const contributionFields = z.object({
  kind: contributionKindSchema,
  /** Always positive; `kind` says which way the money moved. */
  amountPence: penceSchema,
  date: isoDateSchema,
  note: z
    .string()
    .trim()
    .max(
      CONTRIBUTION_NOTE_MAX_LENGTH,
      `Keep the note under ${String(CONTRIBUTION_NOTE_MAX_LENGTH)} characters`,
    )
    .optional(),
});

export const contributionDraftSchema = contributionFields;
export type ContributionDraft = z.infer<typeof contributionDraftSchema>;

export const goalContributionSchema = contributionFields.extend({
  id: idSchema,
  goalId: idSchema,
  createdAt: isoDateTimeSchema,
  isDemo: z.boolean(),
});
export type GoalContribution = z.infer<typeof goalContributionSchema>;
