import { z } from 'zod';
import type { AppDataAction } from '../../context/appDataReducer';
import type { GoalContribution, SavingsGoal } from '../../models/savings';
import {
  contributionDraftSchema,
  goalContributionSchema,
  goalDraftSchema,
  savingsGoalSchema,
} from '../../models/savings';
import { formatPence } from '../../utils/money';
import type { CommandResult } from '../transactions/transactionCommands';
import { savedPence } from './goalProgress';

export function buildAddGoal(
  input: unknown,
  { id, now }: { id: string; now: string },
): CommandResult<Extract<AppDataAction, { type: 'goalAdded' }>> {
  const draft = goalDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };
  const goal = savingsGoalSchema.parse({
    ...draft.data,
    id,
    createdAt: now,
    updatedAt: now,
    isDemo: false,
  });
  return { ok: true, value: { type: 'goalAdded', goal } };
}

export function buildUpdateGoal(
  id: string,
  input: unknown,
  { now }: { now: string },
): CommandResult<Extract<AppDataAction, { type: 'goalUpdated' }>> {
  const draft = goalDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };
  return { ok: true, value: { type: 'goalUpdated', id, changes: draft.data, updatedAt: now } };
}

/**
 * Validates money moved into or out of a goal. A withdrawal can't take out
 * more than the goal holds, so a balance can never go below zero.
 */
export function buildAddContribution(
  goal: SavingsGoal,
  input: unknown,
  existing: readonly GoalContribution[],
  { id, now }: { id: string; now: string },
): CommandResult<Extract<AppDataAction, { type: 'contributionAdded' }>> {
  const draft = contributionDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, fieldErrors: z.flattenError(draft.error).fieldErrors };

  const balance = savedPence(existing, goal.id);
  if (draft.data.kind === 'withdrawal' && draft.data.amountPence > balance) {
    return {
      ok: false,
      fieldErrors: {
        amountPence: [
          balance === 0
            ? 'There’s nothing in this goal to withdraw'
            : `You can withdraw up to ${formatPence(balance)}`,
        ],
      },
    };
  }

  const contribution = goalContributionSchema.parse({
    ...draft.data,
    id,
    goalId: goal.id,
    createdAt: now,
    isDemo: false,
  });
  return { ok: true, value: { type: 'contributionAdded', contribution } };
}

/** Deleting a deposit is refused if money has since been withdrawn from it. */
export function buildDeleteContribution(
  contribution: GoalContribution,
  existing: readonly GoalContribution[],
):
  | { ok: true; value: Extract<AppDataAction, { type: 'contributionDeleted' }> }
  | {
      ok: false;
      error: string;
    } {
  const balanceAfter =
    savedPence(existing, contribution.goalId) -
    (contribution.kind === 'deposit' ? contribution.amountPence : -contribution.amountPence);
  if (balanceAfter < 0) {
    return {
      ok: false,
      error:
        'This deposit can’t be deleted because the money has been withdrawn. Delete the withdrawal first.',
    };
  }
  return { ok: true, value: { type: 'contributionDeleted', id: contribution.id } };
}
