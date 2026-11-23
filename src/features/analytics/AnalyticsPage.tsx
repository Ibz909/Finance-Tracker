import { ChartPie, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../hooks/useAppData';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import {
  categoryBreakdown,
  DEFAULT_RANGE_MONTHS,
  monthlyTotals,
  monthsEndingAt,
  rangeLabel,
} from './analytics';
import { CategoryBreakdownCard, IncomeExpenseCard, SpendingTrendCard } from './AnalyticsCharts';
import { CategoryRanking } from './CategoryRanking';

export function AnalyticsPage() {
  const { transactions } = useAppData();
  const { month } = useReportingMonth();
  const { openAddTransaction } = useTransactionDialog();

  const months = useMemo(() => monthsEndingAt(month, DEFAULT_RANGE_MONTHS), [month]);
  const totals = useMemo(() => monthlyTotals(transactions, months), [transactions, months]);
  const breakdown = useMemo(() => categoryBreakdown(transactions, months), [transactions, months]);

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
      <p className="text-sm text-muted-foreground">
        Showing the {DEFAULT_RANGE_MONTHS} months to {rangeLabel([month])}: {rangeLabel(months)}.
      </p>
      <div className="grid gap-6 xl:grid-cols-2">
        <IncomeExpenseCard totals={totals} />
        <SpendingTrendCard totals={totals} />
        <CategoryBreakdownCard breakdown={breakdown} months={months} />
        <CategoryRanking breakdown={breakdown} months={months} />
      </div>
    </div>
  );
}
