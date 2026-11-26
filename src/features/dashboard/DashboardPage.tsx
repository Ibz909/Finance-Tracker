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
import { CashFlowPanel } from './CashFlowPanel';
import { MonthlyBudgetPanel } from './MonthlyBudgetPanel';
import { OverviewSummary } from './OverviewSummary';
import { RecentTransactions } from './RecentTransactions';
import { SavingsOverview } from './SavingsOverview';
import { recentTransactions, summariseMonth } from './summary';

export function DashboardPage() {
  const { transactions, budgets, recurringSchedules, savingsGoals, goalContributions } =
    useAppData();
  const today = todayIsoDate(useClock()());
  const { month, currentMonth } = useReportingMonth();
  const { openAddTransaction } = useTransactionDialog();
  const { loadDemoData } = useDemoDataActions();
  const { showToast } = useToast();

  // Derived, never stored: recalculated only when the data or month changes.
  const summary = useMemo(() => summariseMonth(transactions, month), [transactions, month]);
  const recent = useMemo(() => recentTransactions(transactions, month), [transactions, month]);

  // Welcome only someone with nothing set up yet. Budgets, goals or recurring
  // items without transactions still get the dashboard: every section has
  // its own empty state, and the budget and savings panels have content.
  const hasAnyData =
    transactions.length > 0 ||
    budgets.length > 0 ||
    recurringSchedules.length > 0 ||
    savingsGoals.length > 0;

  if (!hasAnyData) {
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

  // One answer first, then the trend beside what's left to spend, then detail.
  return (
    <div className="space-y-8">
      <OverviewSummary summary={summary} month={month} isCurrentMonth={month === currentMonth} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CashFlowPanel transactions={transactions} month={month} />
        <MonthlyBudgetPanel budgets={budgets} transactions={transactions} month={month} />
      </div>
      <RecentTransactions transactions={recent} month={month} />
      <SavingsOverview goals={savingsGoals} contributions={goalContributions} today={today} />
    </div>
  );
}
