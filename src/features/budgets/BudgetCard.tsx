import { Pencil, Trash2, Wallet } from 'lucide-react';
import { useId } from 'react';
import { Button } from '../../components/ui/Button';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { Budget } from '../../models/budget';
import { formatPence } from '../../utils/money';
import { budgetLabel } from './budgetLabel';
import type { BudgetProgress } from './budgetProgress';
import { BudgetStatusBadge } from './BudgetStatusBadge';
import { STATUS_DISPLAY } from './budgetStatusDisplay';

interface BudgetCardProps {
  progress: BudgetProgress;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetCard({ progress, onEdit, onDelete }: BudgetCardProps) {
  const { budget, spentPence, remainingPence, percentUsed, status } = progress;
  const titleId = useId();
  const name = budgetLabel(budget);
  // The section above is already headed "Monthly budget", so say what it covers.
  const title = budget.scope === 'overall' ? 'All spending' : name;

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {budget.scope === 'overall' ? (
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
          >
            <Wallet className="size-5" />
          </span>
        ) : (
          <CategoryIcon categoryId={budget.categoryId ?? ''} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={titleId} className="font-semibold break-words">
              {title}
            </h3>
            {budget.isDemo && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Demo
              </span>
            )}
          </div>
          <div className="mt-1">
            <BudgetStatusBadge status={status} />
          </div>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${name} budget`}
            onClick={() => {
              onEdit(budget);
            }}
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-negative"
            aria-label={`Delete ${name} budget`}
            onClick={() => {
              onDelete(budget);
            }}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      <p className="tabular-nums">
        <span className="text-xl font-semibold tracking-tight">{formatPence(spentPence)}</span>
        <span className="text-sm text-muted-foreground">
          {' '}
          spent of {formatPence(budget.limitPence)}
        </span>
      </p>

      <ProgressBar
        percent={percentUsed}
        label={`${title} used`}
        tone={STATUS_DISPLAY[status].bar}
      />

      <div className="flex justify-between gap-3 text-sm tabular-nums">
        <span
          className={remainingPence < 0 ? 'font-medium text-negative' : 'text-muted-foreground'}
        >
          {remainingPence < 0
            ? `${formatPence(-remainingPence)} over`
            : `${formatPence(remainingPence)} left`}
        </span>
        <span className="text-muted-foreground">{percentUsed}% used</span>
      </div>
    </section>
  );
}
