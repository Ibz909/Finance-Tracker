import { ArrowDownToLine, ArrowUpFromLine, PiggyBank, Pencil, Trash2, X } from 'lucide-react';
import { useId } from 'react';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { ContributionKind, GoalContribution, SavingsGoal } from '../../models/savings';
import { formatDisplayDate, formatMonthLabel, toMonthKey } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import type { GoalProgress } from './goalProgress';
import { GoalStatusBadge } from './GoalStatusBadge';
import { GOAL_STATUS_DISPLAY } from './goalStatusDisplay';

interface GoalCardProps {
  progress: GoalProgress;
  /** This goal's contributions, newest first. */
  history: readonly GoalContribution[];
  onContribute: (goal: SavingsGoal, kind: ContributionKind) => void;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
  onDeleteContribution: (contribution: GoalContribution) => void;
}

export function GoalCard({
  progress,
  history,
  onContribute,
  onEdit,
  onDelete,
  onDeleteContribution,
}: GoalCardProps) {
  const { goal, savedPence, remainingPence, percent, status, monthlyNeededPence } = progress;
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
        >
          <PiggyBank className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={titleId} className="font-semibold break-words">
              {goal.name}
            </h3>
            {goal.isDemo && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Demo
              </span>
            )}
          </div>
          <div className="mt-1">
            <GoalStatusBadge status={status} />
          </div>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${goal.name}`}
            onClick={() => {
              onEdit(goal);
            }}
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-negative"
            aria-label={`Delete ${goal.name}`}
            onClick={() => {
              onDelete(goal);
            }}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      <p className="tabular-nums">
        <span className="text-xl font-semibold tracking-tight">{formatPence(savedPence)}</span>
        <span className="text-sm text-muted-foreground">
          {' '}
          saved of {formatPence(goal.targetPence)}
        </span>
      </p>

      <ProgressBar
        percent={percent}
        label={`${goal.name} progress`}
        tone={GOAL_STATUS_DISPLAY[status].bar}
        valueText={`${String(percent)}% saved`}
      />

      <div className="flex justify-between gap-3 text-sm tabular-nums">
        <span className="text-muted-foreground">
          {remainingPence === 0 ? 'Target reached' : `${formatPence(remainingPence)} to go`}
        </span>
        <span className="text-muted-foreground">{percent}% saved</span>
      </div>

      <GoalTimeline progress={progress} monthlyNeededPence={monthlyNeededPence} />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          aria-label={`Add money to ${goal.name}`}
          onClick={() => {
            onContribute(goal, 'deposit');
          }}
        >
          <ArrowDownToLine aria-hidden="true" className="size-4" />
          Add money
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={savedPence <= 0}
          aria-label={`Withdraw from ${goal.name}`}
          onClick={() => {
            onContribute(goal, 'withdrawal');
          }}
        >
          <ArrowUpFromLine aria-hidden="true" className="size-4" />
          Withdraw
        </Button>
      </div>

      {history.length > 0 && (
        <details className="group border-t border-border pt-3 text-sm">
          <summary className="cursor-pointer rounded-md font-medium text-accent">
            History ({history.length})
          </summary>
          <ul className="mt-2 divide-y divide-border">
            {history.map((c) => {
              const isDeposit = c.kind === 'deposit';
              const what = `${isDeposit ? 'deposit' : 'withdrawal'} of ${formatPence(c.amountPence)} on ${formatDisplayDate(c.date)}`;
              return (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="tabular-nums">
                      <span className={isDeposit ? 'font-medium text-positive' : 'font-medium'}>
                        {isDeposit ? '+' : '−'}
                        {formatPence(c.amountPence)}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        {isDeposit ? 'Deposit' : 'Withdrawal'} ·{' '}
                        <time dateTime={c.date}>{formatDisplayDate(c.date)}</time>
                      </span>
                    </p>
                    {c.note && <p className="truncate text-muted-foreground">{c.note}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-negative"
                    aria-label={`Delete ${what}`}
                    onClick={() => {
                      onDeleteContribution(c);
                    }}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}

function GoalTimeline({
  progress,
  monthlyNeededPence,
}: {
  progress: GoalProgress;
  monthlyNeededPence: number | null;
}) {
  const { goal, status } = progress;
  if (!goal.targetDate) return null;
  const by = formatMonthLabel(toMonthKey(goal.targetDate));

  let text: string;
  if (status === 'reached') text = `Target date: ${formatDisplayDate(goal.targetDate)}`;
  else if (status === 'overdue')
    text = `The target date, ${formatDisplayDate(goal.targetDate)}, has passed. Edit the goal to set a new one.`;
  else text = `Save ${formatPence(monthlyNeededPence ?? 0)} a month to reach it by ${by}.`;

  return <p className="rounded-lg bg-muted px-3 py-2 text-sm">{text}</p>;
}
