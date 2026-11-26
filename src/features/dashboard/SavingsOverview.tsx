import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { GoalContribution, SavingsGoal } from '../../models/savings';
import type { IsoDate } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import { getAllGoalProgress } from '../savings/goalProgress';
import { GoalStatusBadge } from '../savings/GoalStatusBadge';
import { GOAL_STATUS_DISPLAY } from '../savings/goalStatusDisplay';

const PREVIEW_COUNT = 3;

interface SavingsOverviewProps {
  goals: readonly SavingsGoal[];
  contributions: readonly GoalContribution[];
  today: IsoDate;
}

/** Total saved and the goals still in progress, soonest target first. */
export function SavingsOverview({ goals, contributions, today }: SavingsOverviewProps) {
  const progress = useMemo(
    () => getAllGoalProgress(goals, contributions, today),
    [goals, contributions, today],
  );
  const totalSaved = progress.reduce((sum, p) => sum + Math.max(p.savedPence, 0), 0);
  const preview = progress.slice(0, PREVIEW_COUNT);

  return (
    <section aria-labelledby="savings-overview-heading" className="min-w-0">
      <div className="flex items-center justify-between gap-4">
        <h2 id="savings-overview-heading" className="text-lg font-semibold">
          Savings goals
        </h2>
        <Link
          to="/savings"
          className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-accent hover:underline"
        >
          {progress.length > 0 ? 'All goals' : 'Set up a goal'}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {progress.length === 0 ? (
        <p className="mt-3 border-t border-border pt-4 text-sm text-muted-foreground">
          No savings goals yet. Create one to follow your progress here.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-lg font-semibold text-foreground tabular-nums">
              {formatPence(totalSaved)}
            </span>{' '}
            saved across {progress.length} {progress.length === 1 ? 'goal' : 'goals'}
          </p>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {preview.map(({ goal, savedPence, percent, status }) => (
              <li key={goal.id} className="space-y-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <span className="break-words">{goal.name}</span>
                    <GoalStatusBadge status={status} />
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {formatPence(savedPence)} of {formatPence(goal.targetPence)} · {percent}%
                  </span>
                </div>
                <ProgressBar
                  percent={percent}
                  label={`${goal.name} progress`}
                  tone={GOAL_STATUS_DISPLAY[status].bar}
                  valueText={`${String(percent)}% saved`}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
