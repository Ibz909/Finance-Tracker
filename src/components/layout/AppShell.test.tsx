import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../../constants/navigation';
import { renderRoute } from '../../test/renderRoute';

function getSidebarNav() {
  // The mobile drawer is a closed <dialog>, so only the sidebar nav is exposed.
  return screen.getByRole('navigation', { name: 'Primary' });
}

describe('AppShell navigation', () => {
  it('renders every primary navigation link', () => {
    renderRoute('/');
    const nav = getSidebarNav();

    for (const { label } of NAV_ITEMS) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it.each(NAV_ITEMS.filter((item) => item.path !== '/'))(
    'navigates to $label and updates the page title',
    async ({ path, label }) => {
      const { user, router } = renderRoute('/');

      await user.click(within(getSidebarNav()).getByRole('link', { name: label }));

      expect(router.state.location.pathname).toBe(path);
      expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument();
      expect(document.title).toBe(`${label} · PencePlot | Personal Finance`);
    },
  );

  it('marks only the current page as active', () => {
    renderRoute('/budgets');
    const nav = getSidebarNav();

    expect(within(nav).getByRole('link', { name: 'Budgets' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it('provides a skip link to the main content', () => {
    renderRoute('/');

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });
});

describe('Mobile navigation', () => {
  it('opens and closes with the menu buttons', async () => {
    const { user } = renderRoute('/');
    const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);

    const drawer = screen.getByRole('dialog', { name: 'Navigation menu' });
    expect(drawer).toHaveAttribute('open');
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(within(drawer).getByRole('button', { name: 'Close navigation menu' }));

    expect(drawer).not.toHaveAttribute('open');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes after choosing a destination', async () => {
    const { user, router } = renderRoute('/');

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Navigation menu' });
    await user.click(within(drawer).getByRole('link', { name: 'Settings' }));

    expect(router.state.location.pathname).toBe('/settings');
    expect(drawer).not.toHaveAttribute('open');
  });
});

describe('Unknown routes', () => {
  it('shows a not-found page inside the app shell with a way back', async () => {
    const { user, router } = renderRoute('/nowhere');

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(getSidebarNav()).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Back to dashboard' }));

    expect(router.state.location.pathname).toBe('/');
  });
});

describe('Branding', () => {
  it('shows the PencePlot wordmark and tagline, with the proper name for screen readers', () => {
    renderRoute('/');
    const sidebar = screen.getByRole('complementary');

    expect(within(sidebar).getByText('penceplot')).toHaveAttribute('aria-hidden', 'true');
    expect(within(sidebar).getByText('PencePlot')).toHaveClass('sr-only');
    expect(within(sidebar).getByText('Your money, in focus.')).toBeInTheDocument();
  });
});
