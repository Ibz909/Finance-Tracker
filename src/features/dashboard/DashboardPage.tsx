import { FlaskConical, Plus, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData, useClock } from '../../hooks/useAppData';
import { useDemoDataActions } from '../../hooks/useDemoDataActions';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import { useToast } from '../../hooks/useToast';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import { todayIsoDate } from '../../utils/dates';
import {
  categoryBreakdown,
  DEFAULT_RANGE_MONTHS,
  monthlyTotals,
  monthsEndingAt,
} from '../analytics/analytics';
import {
  CategoryBreakdownCard,
  IncomeExpenseCard,
  SpendingTrendCard,
} from '../analytics/AnalyticsCharts';
import { BudgetOverview } from './BudgetOverview';
import { RecentTransactions } from './RecentTransactions';
import { SavingsOverview } from './SavingsOverview';
import { recentTransactions, summariseMonth } from './summary';
import { SummaryCards } from './SummaryCards';

export function DashboardPage() {
  const { transactions, budgets, savingsGoals, goalContributions } = useAppData();
  const today = todayIsoDate(useClock()());
  const { month } = useReportingMonth();
  const { openAddTransaction } = useTransactionDialog();
  const { loadDemoData } = useDemoDataActions();
  const { showToast } = useToast();

  // Derived, never stored: recalculated only when the data or month changes.
  const summary = useMemo(() => summariseMonth(transactions, month), [transactions, month]);
  const recent = useMemo(() => recentTransactions(transactions, month), [transactions, month]);
  const trendMonths = useMemo(() => monthsEndingAt(month, DEFAULT_RANGE_MONTHS), [month]);
  const totals = useMemo(
    () => monthlyTotals(transactions, trendMonths),
    [transactions, trendMonths],
  );
  // The category chart reflects the selected month only, like the summary cards.
  const thisMonth = useMemo(() => [month], [month]);
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, thisMonth),
    [transactions, thisMonth],
  );

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Welcome to Finance Tracker"
        description="Add your first income or expense to see your monthly cash flow, savings rate and recent activity here. Or explore with fictional demo data first. Your data stays in this browser."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={openAddTransaction}>
              <Plus aria-hidden="true" className="size-5" />
              Add your first transaction
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                loadDemoData();
                showToast('Demo data loaded');
              }}
            >
              <FlaskConical aria-hidden="true" className="size-5" />
              Explore with demo data
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} month={month} />
      <RecentTransactions transactions={recent} month={month} />
      <BudgetOverview budgets={budgets} transactions={transactions} month={month} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingTrendCard totals={totals} title="Spending over time" />
        <IncomeExpenseCard totals={totals} />
        <CategoryBreakdownCard
          breakdown={breakdown}
          months={thisMonth}
          title="Spending by category"
        />
        <SavingsOverview goals={savingsGoals} contributions={goalContributions} today={today} />
      </div>
    </div>
  );
}
