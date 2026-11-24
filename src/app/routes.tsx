import type { RouteObject } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { AppLoading } from './AppLoading';
import { NotFoundPage } from './NotFoundPage';
import type { RouteHandle } from './routeHandle';
import { RouteErrorPage } from './RouteErrorPage';

export type PageName =
  'dashboard' | 'transactions' | 'recurring' | 'budgets' | 'analytics' | 'savings' | 'settings';

/** How a page is attached to its route: loaded on demand (`lazy`) or directly (`element`). */
export type PageRoute = (name: PageName) => Pick<RouteObject, 'element' | 'lazy'>;

/**
 * The route tree, written once. The app passes pages that load on demand;
 * tests pass pages imported directly, so they can render synchronously.
 *
 * One layout route (AppShell) renders the sidebar and top bar once; each
 * page renders inside its <Outlet />.
 */
export function createRoutes(page: PageRoute): RouteObject[] {
  return [
    {
      element: <AppShell />,
      errorElement: <RouteErrorPage />,
      // Shown only on the very first load, while the opening page's code arrives.
      hydrateFallbackElement: <AppLoading />,
      children: [
        {
          index: true,
          ...page('dashboard'),
          handle: { usesReportingMonth: true } satisfies RouteHandle,
        },
        { path: 'transactions', ...page('transactions') },
        { path: 'recurring', ...page('recurring') },
        {
          path: 'budgets',
          ...page('budgets'),
          handle: { usesReportingMonth: true } satisfies RouteHandle,
        },
        // Analytics has its own date-range selector instead of the month picker.
        { path: 'analytics', ...page('analytics') },
        { path: 'savings', ...page('savings') },
        { path: 'settings', ...page('settings') },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];
}
