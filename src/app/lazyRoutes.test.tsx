import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/renderRoute';
import { createRoutes } from './routes';
import { lazyPage } from './router';

/*
 * Other tests use pages imported directly. These open every page through
 * the real on-demand routes, so a wrong import() path or export name fails
 * here instead of in production.
 */
const lazyRoutes = createRoutes(lazyPage);

describe('Pages loaded on demand', () => {
  it.each([
    ['/', 'Welcome to Finance Tracker'],
    ['/transactions', 'No transactions yet'],
    ['/recurring', 'No recurring transactions yet'],
    ['/budgets', 'No budgets yet'],
    ['/analytics', 'Nothing to analyse yet'],
    ['/savings', 'No savings goals yet'],
    ['/settings', 'Appearance'],
  ])('%s loads its page', async (path, heading) => {
    renderRoute(path, { routes: lazyRoutes });

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('navigates between pages loaded on demand', async () => {
    const { user } = renderRoute('/settings', { routes: lazyRoutes });
    await screen.findByRole('heading', { name: 'Appearance' });

    const [link] = screen.getAllByRole('link', { name: 'Budgets' });
    if (!link) throw new Error('Budgets link not found');
    await user.click(link);

    expect(await screen.findByRole('heading', { name: 'No budgets yet' })).toBeInTheDocument();
  });
});
