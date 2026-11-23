import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../app/router';

/**
 * Renders the real route tree at a given URL using an in-memory history,
 * so tests exercise the same routing as the app without a browser.
 */
export function renderRoute(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  return { user, router, ...render(<RouterProvider router={router} />) };
}
