import { useMemo } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import { RecentTransactions } from './RecentTransactions';
import { recentTransactions, summariseMonth } from './summary';
import { SummaryCards } from './SummaryCards';

export function DashboardPage() {
  const { transactions } = useAppData();
  const { month } = useReportingMonth();

  // Derived, never stored: recalculated only when the data or month changes.
  const summary = useMemo(() => summariseMonth(transactions, month), [transactions, month]);
  const recent = useMemo(() => recentTransactions(transactions, month), [transactions, month]);

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} month={month} />
      <RecentTransactions transactions={recent} month={month} />
    </div>
  );
}
