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
    <section
      aria-labelledby="savings-overview-heading"
      className="min-w-0 self-start rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <h2 id="savings-overview-heading" className="text-base font-semibold">
          Savings goals
        </h2>
        <Link
          to="/savings"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-accent hover:underline"
        >
          {progress.length > 0 ? 'All goals' : 'Set up a goal'}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {progress.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          No savings goals yet. Create one to follow your progress here.
        </p>
      ) : (
        <>
          <p className="px-4 pt-4 text-sm text-muted-foreground sm:px-6">
            <span className="text-lg font-semibold text-foreground tabular-nums">
              {formatPence(totalSaved)}
            </span>{' '}
            saved across {progress.length} {progress.length === 1 ? 'goal' : 'goals'}
          </p>
          <ul className="divide-y divide-border">
            {preview.map(({ goal, savedPence, percent, status }) => (
              <li key={goal.id} className="space-y-2 px-4 py-3 sm:px-6">
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
