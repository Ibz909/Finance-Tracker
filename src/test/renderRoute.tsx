import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../app/router';
import { AppDataProvider } from '../context/AppDataProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import type { DataRepository } from '../services/storage/DataRepository';
import { createMemoryRepository } from '../services/storage/memoryRepository';

interface Options {
  /** Defaults to an empty in-memory repository, isolated per test. */
  repository?: DataRepository;
}

/**
 * Renders the real route tree at a given URL using an in-memory history,
 * wrapped in the same providers as App, so tests exercise real behaviour.
 */
export function renderRoute(path = '/', { repository = createMemoryRepository() }: Options = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  return {
    user,
    router,
    repository,
    ...render(
      <ThemeProvider>
        <AppDataProvider repository={repository}>
          <RouterProvider router={router} />
        </AppDataProvider>
      </ThemeProvider>,
    ),
  };
}
