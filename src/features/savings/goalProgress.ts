import { differenceInCalendarMonths } from 'date-fns';
import type { GoalContribution, SavingsGoal } from '../../models/savings';
import type { IsoDate } from '../../utils/dates';
import { parseIsoDate } from '../../utils/dates';

/** What a goal's contributions add up to. Never stored, always derived. */
export function savedPence(contributions: readonly GoalContribution[], goalId: string): number {
  let total = 0;
  for (const c of contributions) {
    if (c.goalId !== goalId) continue;
    total += c.kind === 'deposit' ? c.amountPence : -c.amountPence;
  }
  return total;
}

/**
 * How much to save each month to reach the target by its date, in pence.
 * Returns null if there is nothing left to save or the date has passed.
 *
 * The months counted include this month and the target's month: on
 * 15 November with a March target that is Nov, Dec, Jan, Feb and Mar, so 5.
 * `differenceInCalendarMonths` counts month boundaries crossed (4 here) and
 * ignores the day, so add 1 for the current month.
 *
 * The amount is rounded *up* to the next penny, so saving it every month
 * always reaches the target: £1,000 over 3 months is £333.34, because
 * 3 × £333.33 would leave you 1p short. `Math.ceil` on whole pence avoids
 * floating-point pounds entirely.
 */
export function monthlyAmountNeeded(
  remainingPence: number,
  today: IsoDate,
  targetDate: IsoDate,
): number | null {
  if (remainingPence <= 0 || targetDate < today) return null;
  const months = differenceInCalendarMonths(parseIsoDate(targetDate), parseIsoDate(today)) + 1;
  return Math.ceil(remainingPence / months);
}

export type GoalStatus = 'reached' | 'overdue' | 'in-progress';

export interface GoalProgress {
  goal: SavingsGoal;
  savedPence: number;
  /** Never negative: 0 once the target is reached. */
  remainingPence: number;
  /** Whole percent saved, rounded down; can exceed 100. */
  percent: number;
  status: GoalStatus;
  /** Per month to reach the target by its date; null without one, or once reached or passed. */
  monthlyNeededPence: number | null;
}

export function getGoalProgress(
  goal: SavingsGoal,
  contributions: readonly GoalContribution[],
  today: IsoDate,
): GoalProgress {
  const saved = savedPence(contributions, goal.id);
  const remaining = Math.max(goal.targetPence - saved, 0);
  // Integer maths: saved × 100 / target, rounded down, so 99.9% never shows as 100%.
  const percent = Math.floor((Math.max(saved, 0) * 100) / goal.targetPence);

  let status: GoalStatus = 'in-progress';
  if (remaining === 0) status = 'reached';
  else if (goal.targetDate !== undefined && goal.targetDate < today) status = 'overdue';

  return {
    goal,
    savedPence: saved,
    remainingPence: remaining,
    percent,
    status,
    monthlyNeededPence:
      goal.targetDate === undefined ? null : monthlyAmountNeeded(remaining, today, goal.targetDate),
  };
}

/** Goals still being saved for first (soonest target date first), then reached ones. */
export function getAllGoalProgress(
  goals: readonly SavingsGoal[],
  contributions: readonly GoalContribution[],
  today: IsoDate,
): GoalProgress[] {
  const rank = (p: GoalProgress) => (p.status === 'reached' ? 1 : 0);
  return goals
    .map((goal) => getGoalProgress(goal, contributions, today))
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (a.goal.targetDate ?? '9999-12-31').localeCompare(b.goal.targetDate ?? '9999-12-31') ||
        a.goal.createdAt.localeCompare(b.goal.createdAt),
    );
}

/** A goal's contributions, newest first. */
export function contributionsFor(
  contributions: readonly GoalContribution[],
  goalId: string,
): GoalContribution[] {
  return contributions
    .filter((c) => c.goalId === goalId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}
