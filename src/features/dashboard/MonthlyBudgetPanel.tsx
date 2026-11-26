import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { Budget } from '../../models/budget';
import type { Transaction } from '../../models/transaction';
import type { MonthKey } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import type { BudgetProgress } from '../budgets/budgetProgress';
import { getMonthBudgets } from '../budgets/budgetProgress';
import { STATUS_DISPLAY } from '../budgets/budgetStatusDisplay';

interface MonthlyBudgetPanelProps {
  budgets: readonly Budget[];
  transactions: readonly Transaction[];
  month: MonthKey;
}

const OVERALL_SENTENCE = {
  normal: 'You’re on track for your monthly limit.',
  warning: 'You’re approaching your monthly limit.',
  exceeded: 'You’ve gone over your monthly limit.',
} as const;

const SENTENCE_TONE = {
  normal: 'text-muted-foreground',
  warning: 'text-warning',
  exceeded: 'text-negative',
} as const;

/**
 * What's left of the monthly budget, beside the cash flow chart. Category
 * budgets appear as one summary line, and only when one needs attention.
 */
export function MonthlyBudgetPanel({ budgets, transactions, month }: MonthlyBudgetPanelProps) {
  const { overall, categories } = useMemo(
    () => getMonthBudgets(budgets, transactions, month),
    [budgets, transactions, month],
  );
  const categoryNote = categoryAttention(categories);

  return (
    <section
      aria-labelledby="monthly-budget-heading"
      className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-4 sm:p-5"
    >
      <h2 id="monthly-budget-heading" className="text-lg font-semibold">
        Monthly budget
      </h2>

      {overall ? (
        <OverallSummary progress={overall} />
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {categories.length > 0
            ? 'No monthly limit set. Add one to see what’s left to spend overall.'
            : 'No budgets yet. Set a monthly limit to see what’s left to spend.'}
        </p>
      )}

      {categoryNote && (
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
          {categoryNote}
        </p>
      )}

      <Link
        to="/budgets"
        className="mt-4 inline-flex items-center gap-1 self-start rounded-sm text-sm font-medium text-accent hover:underline"
      >
        {budgets.length > 0 ? 'View budgets' : 'Set up a budget'}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

function OverallSummary({ progress }: { progress: BudgetProgress }) {
  const { budget, spentPence, remainingPence, percentUsed, status } = progress;
  const over = remainingPence < 0;

  return (
    <>
      <p className="mt-3 text-sm text-muted-foreground">
        {over ? 'Over your limit by' : 'Remaining to spend'}
      </p>
      <p
        className={`mt-1 text-2xl leading-tight lg:text-[1.75rem] font-semibold tracking-[-0.02em] ${
          status === 'exceeded' ? 'text-negative' : status === 'warning' ? 'text-warning' : ''
        }`}
      >
        {formatPence(Math.abs(remainingPence))}
      </p>
      <div className="mt-3">
        <ProgressBar
          percent={percentUsed}
          label="Monthly budget used"
          tone={STATUS_DISPLAY[status].bar}
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-sm text-muted-foreground">
        <span>{formatPence(spentPence)} spent</span>
        <span>{formatPence(budget.limitPence)} limit</span>
      </div>
      <p className={`mt-4 border-t border-border pt-4 text-sm ${SENTENCE_TONE[status]}`}>
        {OVERALL_SENTENCE[status]} {percentUsed}% used.
      </p>
    </>
  );
}

/** "2 category budgets are close to their limits." or nothing when every category is fine. */
function categoryAttention(categories: readonly BudgetProgress[]): string | null {
  const near = categories.filter((c) => c.status === 'warning').length;
  const over = categories.filter((c) => c.status === 'exceeded').length;
  const count = (n: number) =>
    n === 1 ? '1 category budget is' : `${String(n)} category budgets are`;
  const limit = (n: number) => (n === 1 ? 'its limit' : 'their limits');
  if (near > 0 && over > 0)
    return `${count(near)} close to ${limit(near)}, and ${count(over)} over.`;
  if (near > 0) return `${count(near)} close to ${limit(near)}.`;
  if (over > 0) return `${count(over)} over ${limit(over)}.`;
  return null;
}
