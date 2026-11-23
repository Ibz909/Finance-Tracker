import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../app/router';
import { ThemeProvider } from '../context/ThemeProvider';

/**
 * Renders the real route tree at a given URL using an in-memory history,
 * wrapped in the same providers as App, so tests exercise real behaviour.
 */
export function renderRoute(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  return {
    user,
    router,
    ...render(
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>,
    ),
  };
}
