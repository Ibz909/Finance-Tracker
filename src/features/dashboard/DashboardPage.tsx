import {
  ChartColumn,
  ChartLine,
  ChartPie,
  FlaskConical,
  PiggyBank,
  Plus,
  Target,
  Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../hooks/useAppData';
import { useDemoDataActions } from '../../hooks/useDemoDataActions';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import { useToast } from '../../hooks/useToast';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import { ComingSoonPanel } from './ComingSoonPanel';
import { RecentTransactions } from './RecentTransactions';
import { recentTransactions, summariseMonth } from './summary';
import { SummaryCards } from './SummaryCards';

const UPCOMING = [
  {
    title: 'Spending over time',
    description: 'A month-by-month chart of what you spend.',
    icon: ChartLine,
  },
  {
    title: 'Income vs expenses',
    description: 'Compare money in and money out across months.',
    icon: ChartColumn,
  },
  {
    title: 'Spending by category',
    description: 'See which categories take the biggest share.',
    icon: ChartPie,
  },
  {
    title: 'Budget progress',
    description: 'Track this month’s spending against your limits.',
    icon: Target,
  },
  {
    title: 'Savings goals',
    description: 'Follow progress towards the goals you set.',
    icon: PiggyBank,
  },
] as const;

export function DashboardPage() {
  const { transactions } = useAppData();
  const { month } = useReportingMonth();
  const { openAddTransaction } = useTransactionDialog();
  const { loadDemoData } = useDemoDataActions();
  const { showToast } = useToast();

  // Derived, never stored: recalculated only when the data or month changes.
  const summary = useMemo(() => summariseMonth(transactions, month), [transactions, month]);
  const recent = useMemo(() => recentTransactions(transactions, month), [transactions, month]);

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
      <div className="grid gap-4 lg:grid-cols-2">
        {UPCOMING.map((panel) => (
          <ComingSoonPanel key={panel.title} {...panel} />
        ))}
      </div>
    </div>
  );
}
