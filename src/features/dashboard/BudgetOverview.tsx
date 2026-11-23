import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { Budget } from '../../models/budget';
import type { Transaction } from '../../models/transaction';
import type { MonthKey } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import { budgetLabel } from '../budgets/budgetLabel';
import type { BudgetProgress } from '../budgets/budgetProgress';
import { getMonthBudgets } from '../budgets/budgetProgress';
import { BudgetStatusBadge } from '../budgets/BudgetStatusBadge';
import { STATUS_DISPLAY } from '../budgets/budgetStatusDisplay';

/** How many category budgets to preview: the ones closest to (or over) their limit. */
const PREVIEW_COUNT = 3;

interface BudgetOverviewProps {
  budgets: readonly Budget[];
  transactions: readonly Transaction[];
  month: MonthKey;
}

export function BudgetOverview({ budgets, transactions, month }: BudgetOverviewProps) {
  const rows = useMemo(() => {
    const { overall, categories } = getMonthBudgets(budgets, transactions, month);
    const mostUsed = [...categories]
      .sort((a, b) => b.percentUsed - a.percentUsed)
      .slice(0, PREVIEW_COUNT);
    return overall ? [overall, ...mostUsed] : mostUsed;
  }, [budgets, transactions, month]);

  return (
    <section
      aria-labelledby="budget-overview-heading"
      className="rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <h2 id="budget-overview-heading" className="text-base font-semibold">
          Budget progress
        </h2>
        <Link
          to="/budgets"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-accent hover:underline"
        >
          {rows.length > 0 ? 'All budgets' : 'Set up a budget'}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          No budgets yet. Set monthly limits to see how your spending is tracking.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((progress) => (
            <BudgetRow key={progress.budget.id} progress={progress} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BudgetRow({ progress }: { progress: BudgetProgress }) {
  const { budget, spentPence, percentUsed, status } = progress;
  const name = budget.scope === 'overall' ? 'All spending' : budgetLabel(budget);

  return (
    <li className="space-y-2 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-medium">
          {name}
          <BudgetStatusBadge status={status} />
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatPence(spentPence)} of {formatPence(budget.limitPence)} · {percentUsed}%
        </span>
      </div>
      <ProgressBar percent={percentUsed} label={`${name} used`} tone={STATUS_DISPLAY[status].bar} />
    </li>
  );
}
