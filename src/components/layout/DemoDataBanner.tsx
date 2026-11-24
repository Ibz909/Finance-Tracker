import { FlaskConical } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAppData } from '../../hooks/useAppData';

/**
 * Persistent reminder that fictional data is on screen, so demo figures are
 * never mistaken for real finances. Hidden on Settings, where the demo data
 * section explains it in full.
 */
export function DemoDataBanner() {
  const { transactions, budgets, savingsGoals } = useAppData();
  const { pathname } = useLocation();
  const hasDemoData =
    transactions.some((t) => t.isDemo) ||
    budgets.some((b) => b.isDemo) ||
    savingsGoals.some((g) => g.isDemo);

  if (!hasDemoData || pathname === '/settings') return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
      <FlaskConical aria-hidden="true" className="size-4 shrink-0 text-accent" />
      <p className="flex-1">
        <span className="font-medium">You’re viewing fictional demo data.</span>{' '}
        <span className="text-muted-foreground">It’s marked “Demo” wherever it appears.</span>
      </p>
      <Link to="/settings#demo-data" className="font-medium text-accent hover:underline">
        Manage demo data
      </Link>
    </div>
  );
}
