import { HeroFigure } from '../../components/ui/HeroFigure';
import { Metric, MetricList } from '../../components/ui/Metric';
import type { MonthKey } from '../../utils/dates';
import { formatMonthLabel } from '../../utils/dates';
import { formatPercent } from '../../utils/format';
import { formatPence, formatSignedPence } from '../../utils/money';
import type { MonthSummary } from './summary';

interface OverviewSummaryProps {
  summary: MonthSummary;
  month: MonthKey;
  isCurrentMonth: boolean;
}

/** Net cash flow as the page's one answer, with income, expenses and savings rate beneath it. */
export function OverviewSummary({ summary, month, isCurrentMonth }: OverviewSummaryProps) {
  const { incomePence, expensesPence, netPence, savingsRate, transactionCount } = summary;
  const when = isCurrentMonth ? 'this month' : `in ${formatMonthLabel(month)}`;

  const sentence =
    transactionCount === 0
      ? `Nothing recorded ${when} yet.`
      : netPence > 0
        ? `You’ve spent less than you’ve earned ${when}.`
        : netPence < 0
          ? `You’ve spent more than you’ve earned ${when}.`
          : `Your income and spending are equal ${when}.`;

  return (
    <div className="space-y-5">
      <HeroFigure
        label={
          isCurrentMonth ? 'Net cash flow this month' : `Net cash flow, ${formatMonthLabel(month)}`
        }
        value={
          netPence === 0
            ? formatPence(0)
            : formatSignedPence(Math.abs(netPence), netPence > 0 ? 'in' : 'out')
        }
        tone={netPence < 0 ? 'negative' : 'neutral'}
      >
        <p className={netPence > 0 ? 'text-positive' : netPence < 0 ? 'text-negative' : undefined}>
          {sentence}
        </p>
      </HeroFigure>

      <MetricList label={`Summary for ${formatMonthLabel(month)}`} framed>
        <Metric framed label="Income" value={formatPence(incomePence)} />
        <Metric framed label="Expenses" value={formatPence(expensesPence)} />
        <Metric
          framed
          label="Savings rate"
          value={savingsRate === null ? '—' : formatPercent(savingsRate)}
          tone={savingsRate !== null && savingsRate < 0 ? 'negative' : 'neutral'}
          note={
            savingsRate === null
              ? 'No income, so no rate to show'
              : 'Estimate from cash flow, not money actually saved'
          }
        />
      </MetricList>
    </div>
  );
}
