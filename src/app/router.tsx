import type { LazyRouteFunction, RouteObject } from 'react-router';
import { createBrowserRouter } from 'react-router';
import type { PageName, PageRoute } from './routes';
import { createRoutes } from './routes';

/*
 * Each page is its own chunk, downloaded the first time it is visited.
 * React Router's `lazy` starts the download as soon as a link is followed,
 * before anything renders, and keeps the current page on screen until the
 * next one is ready. (React.lazy would only start once React tried to
 * render the page, which is later.)
 */
const LAZY_PAGES: Record<PageName, LazyRouteFunction<RouteObject>> = {
  dashboard: () =>
    import('../features/dashboard/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
  transactions: () =>
    import('../features/transactions/TransactionsPage').then((m) => ({
      Component: m.TransactionsPage,
    })),
  recurring: () =>
    import('../features/recurring/RecurringPage').then((m) => ({ Component: m.RecurringPage })),
  budgets: () =>
    import('../features/budgets/BudgetsPage').then((m) => ({ Component: m.BudgetsPage })),
  analytics: () =>
    import('../features/analytics/AnalyticsPage').then((m) => ({ Component: m.AnalyticsPage })),
  savings: () =>
    import('../features/savings/SavingsGoalsPage').then((m) => ({
      Component: m.SavingsGoalsPage,
    })),
  settings: () =>
    import('../features/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
};

export const lazyPage: PageRoute = (name) => ({ lazy: LAZY_PAGES[name] });

export const routes = createRoutes(lazyPage);

export const router = createBrowserRouter(routes);
