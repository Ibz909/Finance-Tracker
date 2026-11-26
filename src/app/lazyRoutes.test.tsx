import { screen } from '@testing-library/react';
import type { ComponentType } from 'react';
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
    ['/', 'Welcome to PencePlot'],
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

describe('While a page is loading', () => {
  it('keeps the current page, marks the content busy and shows a bar', async () => {
    let finishLoading: (route: { Component: ComponentType }) => void = () => undefined;
    const slowBudgets = new Promise<{ Component: ComponentType }>((resolve) => {
      finishLoading = resolve;
    });
    const routes = createRoutes((name) =>
      name === 'budgets' ? { lazy: () => slowBudgets } : lazyPage(name),
    );
    const { user } = renderRoute('/settings', { routes });
    await screen.findByRole('heading', { name: 'Appearance' });

    const [link] = screen.getAllByRole('link', { name: 'Budgets' });
    if (!link) throw new Error('Budgets link not found');
    await user.click(link);

    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('page-loading-bar')).toBeInTheDocument();

    finishLoading({ Component: () => <h2>Budgets loaded</h2> });

    expect(await screen.findByRole('heading', { name: 'Budgets loaded' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByTestId('page-loading-bar')).not.toBeInTheDocument();
  });
});
