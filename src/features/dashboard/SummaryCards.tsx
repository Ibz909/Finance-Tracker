import { ArrowDownLeft, ArrowUpRight, PiggyBank, Scale } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import type { MonthKey } from '../../utils/dates';
import { formatMonthLabel } from '../../utils/dates';
import { formatPercent } from '../../utils/format';
import { formatPence, formatSignedPence } from '../../utils/money';
import type { MonthSummary } from './summary';

interface SummaryCardsProps {
  summary: MonthSummary;
  month: MonthKey;
}

export function SummaryCards({ summary, month }: SummaryCardsProps) {
  const { incomePence, expensesPence, netPence, savingsRate } = summary;

  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Summary for {formatMonthLabel(month)}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Income"
          value={formatPence(incomePence)}
          icon={ArrowDownLeft}
          iconTone="positive"
          footnote="Money received this month"
        />
        <StatCard
          label="Expenses"
          value={formatPence(expensesPence)}
          icon={ArrowUpRight}
          iconTone="negative"
          footnote="Money spent this month"
        />
        <StatCard
          label="Net cash flow"
          value={
            netPence === 0
              ? formatPence(0)
              : formatSignedPence(Math.abs(netPence), netPence > 0 ? 'in' : 'out')
          }
          tone={netPence > 0 ? 'positive' : netPence < 0 ? 'negative' : 'neutral'}
          icon={Scale}
          footnote={
            netPence > 0
              ? 'Surplus: more came in than went out'
              : netPence < 0
                ? 'Deficit: more went out than came in'
                : 'Income and expenses are equal'
          }
        />
        <StatCard
          label="Savings rate"
          value={savingsRate === null ? '—' : formatPercent(savingsRate)}
          tone={savingsRate !== null && savingsRate < 0 ? 'negative' : 'neutral'}
          icon={PiggyBank}
          footnote={
            savingsRate === null
              ? 'No income this month, so no rate to show'
              : 'Estimate from cash flow, not money actually saved'
          }
        />
      </div>
    </section>
  );
}
