import type { RouteObject } from 'react-router';
import { createBrowserRouter } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';
import { BudgetsPage } from '../features/budgets/BudgetsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { RecurringPage } from '../features/recurring/RecurringPage';
import { SavingsGoalsPage } from '../features/savings/SavingsGoalsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';
import { NotFoundPage } from './NotFoundPage';
import type { RouteHandle } from './routeHandle';
import { RouteErrorPage } from './RouteErrorPage';

/**
 * One layout route (AppShell) renders the sidebar and top bar once; each
 * child route renders inside its <Outlet />. Exported separately from the
 * router so tests can mount the same routes in a memory router.
 */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
        handle: { usesReportingMonth: true } satisfies RouteHandle,
      },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'recurring', element: <RecurringPage /> },
      {
        path: 'budgets',
        element: <BudgetsPage />,
        handle: { usesReportingMonth: true } satisfies RouteHandle,
      },
      // Analytics has its own date-range selector instead of the month picker.
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'savings', element: <SavingsGoalsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
