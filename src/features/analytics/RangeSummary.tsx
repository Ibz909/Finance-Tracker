import { ArrowDownLeft, ArrowUpRight, CalendarRange, Scale } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import type { MonthKey } from '../../utils/dates';
import { formatPence, formatSignedPence } from '../../utils/money';
import type { RangeSummary as RangeSummaryData } from './analytics';
import { rangeLabel } from './analytics';

interface RangeSummaryProps {
  summary: RangeSummaryData;
  months: readonly MonthKey[];
}

/** Headline totals for the selected range, from the same monthly figures as the charts. */
export function RangeSummary({ summary, months }: RangeSummaryProps) {
  const { incomePence, expensesPence, netPence, trackedMonths, averageMonthlySpendPence } = summary;
  const multiMonth = months.length > 1;

  return (
    <section aria-labelledby="range-summary-heading">
      <h2 id="range-summary-heading" className="sr-only">
        Totals for {rangeLabel(months)}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Income"
          value={formatPence(incomePence)}
          icon={ArrowDownLeft}
          iconTone="positive"
          footnote="Money received in this period"
        />
        <StatCard
          label="Expenses"
          value={formatPence(expensesPence)}
          icon={ArrowUpRight}
          iconTone="negative"
          footnote="Money spent in this period"
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
              ? 'Surplus for the period'
              : netPence < 0
                ? 'Deficit for the period'
                : 'Break even'
          }
        />
        <StatCard
          label="Average monthly spend"
          value={averageMonthlySpendPence === null ? '—' : formatPence(averageMonthlySpendPence)}
          icon={CalendarRange}
          footnote={
            averageMonthlySpendPence === null
              ? 'No records in this period'
              : multiMonth
                ? `Across ${String(trackedMonths)} month${trackedMonths === 1 ? '' : 's'} with records`
                : 'This period is a single month'
          }
        />
      </div>
    </section>
  );
}
