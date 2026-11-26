import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RowMenu } from '../../components/ui/RowMenu';
import type { Budget } from '../../models/budget';
import { formatPence } from '../../utils/money';
import { budgetLabel } from './budgetLabel';
import type { BudgetProgress } from './budgetProgress';
import { STATUS_DISPLAY } from './budgetStatusDisplay';

interface CategoryBudgetRowProps {
  progress: BudgetProgress;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

const PERCENT_TONE = {
  normal: 'text-foreground',
  warning: 'text-warning',
  exceeded: 'text-negative',
} as const;

/** One category budget as an open row: what's spent, the bar, and what's left. */
export function CategoryBudgetRow({ progress, onEdit, onDelete }: CategoryBudgetRowProps) {
  const { budget, spentPence, remainingPence, percentUsed, status } = progress;
  const name = budgetLabel(budget);
  const { label: statusLabel, icon: StatusIcon, bar } = STATUS_DISPLAY[status];
  // "On track" stays quiet; only states that need attention take colour.
  const statusTone = status === 'normal' ? 'text-muted-foreground' : PERCENT_TONE[status];
  const statusText = (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusTone}`}>
      <StatusIcon aria-hidden="true" className="size-3.5" />
      {statusLabel}
    </span>
  );

  return (
    <li className="py-4">
      <div className="flex items-start gap-3">
        <CategoryIcon categoryId={budget.categoryId ?? ''} />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">
            {formatPence(spentPence)} of {formatPence(budget.limitPence)}
            {budget.isDemo && ' · Demo'}
          </p>
        </div>
        {/* Beside the name when there's room; under the bar on the narrowest phones. */}
        <div className="hidden shrink-0 text-right min-[400px]:block">
          <p className={`font-semibold ${PERCENT_TONE[status]}`}>{percentUsed}%</p>
          <p>{statusText}</p>
        </div>
        <div className="-mt-1 -mr-1">
          <RowMenu
            label={`Actions for ${name} budget`}
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
      </div>
      <div className="mt-3">
        <ProgressBar percent={percentUsed} label={`${name} budget used`} tone={bar} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p
          className={`text-sm ${remainingPence < 0 ? 'font-medium text-negative' : 'text-muted-foreground'}`}
        >
          {remainingPence < 0
            ? `${formatPence(-remainingPence)} over`
            : `${formatPence(remainingPence)} remaining`}
        </p>
        <p className="flex items-center gap-2 min-[400px]:hidden">
          <span className={`text-sm font-semibold ${PERCENT_TONE[status]}`}>{percentUsed}%</span>
          {statusText}
        </p>
      </div>
    </li>
  );
}
