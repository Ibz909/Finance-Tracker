import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RouteObject } from 'react-router';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppDataProvider } from '../context/AppDataProvider';
import { ReportingMonthProvider } from '../context/ReportingMonthProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { ToastProvider } from '../context/ToastProvider';
import { TransactionDialogProvider } from '../context/TransactionDialogProvider';
import type { DataRepository } from '../services/storage/DataRepository';
import { createMemoryRepository } from '../services/storage/memoryRepository';
import { eagerRoutes } from './eagerRoutes';

/** Fixed "today" for tests: 15 November 2026, local time. */
export const TEST_NOW = new Date(2026, 10, 15, 12, 0);

interface Options {
  /** Defaults to an empty in-memory repository, isolated per test. */
  repository?: DataRepository;
  /** "Today" for the reporting month and recurring payments. Defaults to TEST_NOW. */
  now?: Date;
  /** Defaults to the app's routes with pages imported directly (no waiting). */
  routes?: RouteObject[];
}

/**
 * Renders the real route tree at a given URL using an in-memory history,
 * wrapped in the same providers as App, so tests exercise real behaviour.
 */
export function renderRoute(
  path = '/',
  { repository = createMemoryRepository(), now = TEST_NOW, routes = eagerRoutes }: Options = {},
) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  return {
    user,
    router,
    repository,
    ...render(
      <ThemeProvider>
        <AppDataProvider repository={repository} clock={() => now}>
          <ToastProvider>
            <TransactionDialogProvider>
              <ReportingMonthProvider now={now}>
                <RouterProvider router={router} />
              </ReportingMonthProvider>
            </TransactionDialogProvider>
          </ToastProvider>
        </AppDataProvider>
      </ThemeProvider>,
    ),
  };
}
