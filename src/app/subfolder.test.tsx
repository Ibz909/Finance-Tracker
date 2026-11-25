import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../constants/navigation';
import { renderRoute } from '../test/renderRoute';
import { routerBasename } from './router';

describe('routerBasename', () => {
  it.each([
    ['/', '/'],
    ['/Finance-Tracker/', '/Finance-Tracker'],
  ])('turns the base URL %s into %s', (baseUrl, expected) => {
    expect(routerBasename(baseUrl)).toBe(expected);
  });
});

describe('Served from a sub-folder (GitHub Pages)', () => {
  const basename = '/Finance-Tracker';

  it('opens a page linked to directly', () => {
    renderRoute('/Finance-Tracker/budgets', { basename });

    expect(screen.getByRole('heading', { level: 1, name: 'Budgets' })).toBeInTheDocument();
  });

  it('keeps every navigation link inside the sub-folder', () => {
    renderRoute('/Finance-Tracker/', { basename });
    const nav = screen.getByRole('navigation', { name: 'Primary' });

    for (const { label, path } of NAV_ITEMS) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute(
        'href',
        path === '/' ? basename : `${basename}${path}`,
      );
    }
  });

  it('navigates between pages without leaving the sub-folder', async () => {
    const { user, router } = renderRoute('/Finance-Tracker/', { basename });

    await user.click(
      within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('link', {
        name: 'Savings Goals',
      }),
    );

    expect(router.state.location.pathname).toBe('/Finance-Tracker/savings');
    expect(screen.getByRole('heading', { level: 1, name: 'Savings Goals' })).toBeInTheDocument();
  });
});
