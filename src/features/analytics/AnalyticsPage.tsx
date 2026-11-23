import { ChartPie, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../hooks/useAppData';
import { useAnalyticsRange } from '../../hooks/useAnalyticsRange';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import { categoryBreakdown, monthlyTotals, summariseRange } from './analytics';
import { CategoryBreakdownCard, IncomeExpenseCard, SpendingTrendCard } from './AnalyticsCharts';
import { CategoryRanking } from './CategoryRanking';
import { RangeSelector } from './RangeSelector';
import { RangeSummary } from './RangeSummary';

export function AnalyticsPage() {
  const { transactions } = useAppData();
  const { rangeId, months, setRange } = useAnalyticsRange();
  const { openAddTransaction } = useTransactionDialog();

  const totals = useMemo(() => monthlyTotals(transactions, months), [transactions, months]);
  const breakdown = useMemo(() => categoryBreakdown(transactions, months), [transactions, months]);
  const summary = useMemo(() => summariseRange(totals), [totals]);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ChartPie}
        title="Nothing to analyse yet"
        description="Charts of your income, spending and categories appear here once you’ve added some transactions."
        action={
          <Button onClick={openAddTransaction}>
            <Plus aria-hidden="true" className="size-5" />
            Add a transaction
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <RangeSelector value={rangeId} months={months} onChange={setRange} />
      <RangeSummary summary={summary} months={months} />
      <div className="grid gap-6 xl:grid-cols-2">
        <IncomeExpenseCard totals={totals} />
        <SpendingTrendCard totals={totals} />
        <CategoryBreakdownCard breakdown={breakdown} months={months} />
        <CategoryRanking breakdown={breakdown} months={months} />
      </div>
    </div>
  );
}
