import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useTransactionFilters } from './useTransactionFilters';

function setup(initialUrl = '/transactions') {
  let hook: ReturnType<typeof useTransactionFilters> | undefined;
  function Probe() {
    hook = useTransactionFilters();
    return null;
  }
  const router = createMemoryRouter([{ path: '/transactions', element: <Probe /> }], {
    initialEntries: [initialUrl],
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <>
      <RouterProvider router={router} />
      {children}
    </>
  );
  renderHook(() => null, { wrapper });
  return {
    router,
    get filters() {
      if (!hook) throw new Error('hook not rendered');
      return hook;
    },
  };
}

describe('useTransactionFilters', () => {
  it('keeps every change when several arrive before the page re-renders', () => {
    const view = setup();
    const { updateFilters } = view.filters;

    // Regression: each update used to start from the URL of the last render,
    // so only the final change survived.
    act(() => {
      updateFilters({ sort: 'amount-desc' });
      updateFilters({ from: '2026-10-01' });
      updateFilters({ to: '2026-10-31' });
    });

    // Parameter order doesn't matter; every value must be there.
    expect(Object.fromEntries(new URLSearchParams(view.router.state.location.search))).toEqual({
      sort: 'amount-desc',
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(view.filters.filters).toMatchObject({
      sort: 'amount-desc',
      from: '2026-10-01',
      to: '2026-10-31',
    });
  });

  it('replaces history entries instead of adding them', () => {
    const view = setup();

    act(() => {
      view.filters.updateFilters({ query: 'g' });
    });
    act(() => {
      view.filters.updateFilters({ query: 'gr' });
    });

    expect(view.router.state.historyAction).toBe('REPLACE');
    expect(view.router.state.location.search).toBe('?q=gr');
  });

  it('follows URL changes made elsewhere, such as Back or a link', async () => {
    const view = setup('/transactions?type=income');

    await act(() => view.router.navigate('/transactions?q=rent'));
    act(() => {
      view.filters.updateFilters({ sort: 'date-asc' });
    });

    // Builds on the new URL, not the one it started with.
    expect(view.router.state.location.search).toBe('?q=rent&sort=date-asc');
  });

  it('resets filters but keeps the sort order', () => {
    const view = setup('/transactions?q=rent&type=expense&sort=amount-asc');

    act(() => {
      view.filters.resetFilters();
    });

    expect(view.router.state.location.search).toBe('?sort=amount-asc');
  });
});
