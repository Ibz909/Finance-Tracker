import type { ReactElement } from 'react';
import type { PageName } from '../app/routes';
import { createRoutes } from '../app/routes';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';
import { BudgetsPage } from '../features/budgets/BudgetsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { RecurringPage } from '../features/recurring/RecurringPage';
import { SavingsGoalsPage } from '../features/savings/SavingsGoalsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';

const PAGE_ELEMENTS: Record<PageName, ReactElement> = {
  dashboard: <DashboardPage />,
  transactions: <TransactionsPage />,
  recurring: <RecurringPage />,
  budgets: <BudgetsPage />,
  analytics: <AnalyticsPage />,
  savings: <SavingsGoalsPage />,
  settings: <SettingsPage />,
};

/**
 * The app's real route tree, with pages imported directly instead of on
 * demand, so tests can render a page synchronously. lazyRoutes.test.tsx
 * checks the on-demand version separately.
 */
export const eagerRoutes = createRoutes((name) => ({ element: PAGE_ELEMENTS[name] }));
