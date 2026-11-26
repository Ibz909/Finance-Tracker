import { HeroFigure } from '../../components/ui/HeroFigure';
import { Metric, MetricList } from '../../components/ui/Metric';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { RowMenu } from '../../components/ui/RowMenu';
import type { Budget } from '../../models/budget';
import type { MonthKey } from '../../utils/dates';
import { formatMonthLabel } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import type { MonthTiming } from './allowance';
import { dailyAllowancePence } from './allowance';
import type { BudgetProgress } from './budgetProgress';
import { BudgetStatusBadge } from './BudgetStatusBadge';
import { STATUS_DISPLAY } from './budgetStatusDisplay';

interface MonthlyBudgetHeroProps {
  progress: BudgetProgress;
  month: MonthKey;
  timing: MonthTiming;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

/**
 * The monthly budget as the page's answer: what's left to spend, a gauge of
 * how much is used, and the budget, spending and daily allowance beneath.
 */
export function MonthlyBudgetHero({
  progress,
  month,
  timing,
  onEdit,
  onDelete,
}: MonthlyBudgetHeroProps) {
  const { budget, spentPence, remainingPence, percentUsed, status } = progress;
  const over = remainingPence < 0;
  const daily = dailyAllowancePence(remainingPence, timing);
  const statusLabel = STATUS_DISPLAY[status].label;

  return (
    <section
      aria-label="Monthly budget"
      className="relative rounded-xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="absolute top-2 right-2">
        <RowMenu
          label="Actions for Monthly budget"
          items={[
            {
              label: 'Edit',
              onSelect: () => {
                onEdit(budget);
              },
            },
            {
              label: 'Delete',
              destructive: true,
              onSelect: () => {
                onDelete(budget);
              },
            },
          ]}
        />
      </div>
      {/* Inset on the right so the gauge clears the menu button. */}
      <div className="pr-10 sm:pr-12">
        <HeroFigure
          label={over ? 'Over budget by' : 'Available to spend'}
          value={formatPence(Math.abs(remainingPence))}
          tone={status === 'exceeded' ? 'negative' : status === 'warning' ? 'warning' : 'neutral'}
          aside={
            <ProgressRing
              percent={percentUsed}
              tone={STATUS_DISPLAY[status].bar}
              label={`${String(percentUsed)}% of your monthly budget used, ${statusLabel.toLowerCase()}`}
            />
          }
        >
          <p>{timingSentence(timing, month)}</p>
          <p className="mt-2">
            <BudgetStatusBadge status={status} />
          </p>
        </HeroFigure>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <MetricList label="Monthly budget figures">
          <Metric label="Budget" value={formatPence(budget.limitPence)} />
          <Metric label="Spent" value={formatPence(spentPence)} />
          <Metric
            label="Daily allowance"
            value={daily === null ? '—' : formatPence(daily)}
            note={allowanceNote(timing, over, daily)}
          />
        </MetricList>
      </div>
    </section>
  );
}

function timingSentence(timing: MonthTiming, month: MonthKey): string {
  if (timing.kind === 'past') return `${formatMonthLabel(month)} has ended.`;
  if (timing.kind === 'future') return `${formatMonthLabel(month)} hasn’t started yet.`;
  if (timing.daysRemaining === 1) return 'Last day of the month.';
  return `${String(timing.daysRemaining)} days remaining this month.`;
}

function allowanceNote(timing: MonthTiming, over: boolean, daily: number | null): string {
  if (timing.kind === 'past') return 'The month has ended';
  if (daily === null) return over ? 'You’re over your limit' : 'Nothing left to spend';
  return timing.kind === 'future' ? 'Per day across the month' : 'Per day to stay within budget';
}
