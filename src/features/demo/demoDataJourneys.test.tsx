import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';
import {
  generateDemoBudgets,
  generateDemoGoals,
  generateDemoSchedules,
  generateDemoTransactions,
} from './demoData';

const NOW = new Date(2026, 10, 15, 12, 0);
const DEMO_COUNT = generateDemoTransactions(NOW).length;
const DEMO_BUDGET_COUNT = generateDemoBudgets(NOW).length;
const DEMO_GOAL_COUNT = generateDemoGoals(NOW).goals.length;
const DEMO_SCHEDULE_COUNT = generateDemoSchedules(NOW).length;

const realTransaction = makeTransaction({
  id: 'real-1',
  description: 'My real purchase',
  date: '2026-11-10',
  isDemo: false,
});

function withRealData() {
  return createMemoryRepository({ ...createEmptyAppData(), transactions: [realTransaction] });
}

function demoSection() {
  return screen.getByRole('region', { name: 'Demo data' });
}

beforeEach(() => {
  // Fake only the clock, so generated demo data is the same on every run.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Loading demo data', () => {
  it('adds flagged demo data from Settings without touching real data', async () => {
    const repository = withRealData();
    const { user } = renderRoute('/settings', { repository });
    expect(demoSection()).toHaveTextContent('No demo data loaded.');

    await user.click(within(demoSection()).getByRole('button', { name: 'Load demo data' }));

    const saved = repository.load().data.transactions;
    expect(saved).toContainEqual(realTransaction);
    expect(saved.filter((t) => t.isDemo)).toHaveLength(DEMO_COUNT);
    expect(demoSection()).toHaveTextContent(
      `${String(DEMO_COUNT)} demo transactions, ${String(DEMO_BUDGET_COUNT)} demo budgets and ${String(DEMO_GOAL_COUNT)} demo savings goals loaded.`,
    );
    expect(repository.load().data.budgets).toHaveLength(DEMO_BUDGET_COUNT);
    expect(repository.load().data.savingsGoals).toHaveLength(DEMO_GOAL_COUNT);
    expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent(
      'Demo data loaded',
    );
  });

  it('never duplicates demo data when loaded again', async () => {
    const repository = withRealData();
    const { user } = renderRoute('/settings', { repository });

    await user.click(screen.getByRole('button', { name: 'Load demo data' }));
    await user.click(screen.getByRole('button', { name: 'Refresh demo data' }));

    expect(repository.load().data.transactions).toHaveLength(DEMO_COUNT + 1);
  });

  it('can be started from the dashboard welcome state and is clearly marked as fictional', async () => {
    const { user } = renderRoute('/');

    await user.click(screen.getByRole('button', { name: 'Explore with demo data' }));

    expect(screen.getByRole('link', { name: 'Manage demo data' })).toBeInTheDocument();
    expect(screen.getByText('Income', { selector: 'dt' }).parentElement).not.toHaveTextContent(
      '£0.00',
    );
    const recent = screen.getByRole('region', { name: 'Recent activity' });
    const rows = within(recent).getAllByRole('row').slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toHaveTextContent('· Demo');
    }
  });

  it('shows the demo banner everywhere except Settings', async () => {
    const { user } = renderRoute('/settings', { repository: withRealData() });
    await user.click(screen.getByRole('button', { name: 'Load demo data' }));
    expect(screen.queryByRole('link', { name: 'Manage demo data' })).not.toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    await user.click(within(nav).getByRole('link', { name: 'Transactions' }));

    expect(screen.getByRole('link', { name: 'Manage demo data' })).toHaveAttribute(
      'href',
      '/settings#demo-data',
    );
  });
});

describe('Demo recurring schedules', () => {
  it('appear on the Recurring page, marked as demo, and go when demo data is cleared', async () => {
    const { user } = renderRoute('/settings', { repository: withRealData() });
    await user.click(screen.getByRole('button', { name: 'Load demo data' }));

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    await user.click(within(nav).getByRole('link', { name: 'Recurring' }));
    const rows = within(screen.getByRole('region', { name: 'All recurring' })).getAllByRole(
      'listitem',
    );
    expect(rows).toHaveLength(DEMO_SCHEDULE_COUNT);
    for (const row of rows) {
      expect(row).toHaveTextContent('· Demo');
    }
    await user.click(screen.getByRole('button', { name: 'Actions for Video streaming' }));
    expect(screen.getByRole('menuitem', { name: 'Resume' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(within(nav).getByRole('link', { name: 'Settings' }));
    await user.click(within(demoSection()).getByRole('button', { name: 'Clear demo data' }));
    const confirm = screen.getByRole('dialog', { name: 'Clear demo data?' });
    await user.click(within(confirm).getByRole('button', { name: 'Clear demo data' }));
    await user.click(within(nav).getByRole('link', { name: 'Recurring' }));

    expect(screen.queryByText('Monthly salary')).not.toBeInTheDocument();
  });
});

describe('Clearing demo data', () => {
  it('asks first, and Cancel changes nothing', async () => {
    const repository = withRealData();
    const { user } = renderRoute('/settings', { repository });
    await user.click(screen.getByRole('button', { name: 'Load demo data' }));

    await user.click(within(demoSection()).getByRole('button', { name: 'Clear demo data' }));

    const confirm = screen.getByRole('dialog', { name: 'Clear demo data?' });
    expect(confirm).toHaveAccessibleDescription(
      `This removes ${String(DEMO_COUNT)} demo transactions, ${String(DEMO_BUDGET_COUNT)} demo budgets and ${String(DEMO_GOAL_COUNT)} demo savings goals. Your own data is not affected.`,
    );
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));

    expect(repository.load().data.transactions).toHaveLength(DEMO_COUNT + 1);
  });

  it('removes only demo records once confirmed', async () => {
    const repository = withRealData();
    const { user } = renderRoute('/settings', { repository });
    await user.click(screen.getByRole('button', { name: 'Load demo data' }));

    await user.click(within(demoSection()).getByRole('button', { name: 'Clear demo data' }));
    const confirm = screen.getByRole('dialog', { name: 'Clear demo data?' });
    await user.click(within(confirm).getByRole('button', { name: 'Clear demo data' }));

    expect(repository.load().data.transactions).toEqual([realTransaction]);
    expect(demoSection()).toHaveTextContent('No demo data loaded.');
    expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent(
      'Demo data cleared',
    );
  });

  it('also removes demo records the user had edited', async () => {
    const editedDemo = makeTransaction({ id: 'demo-x', isDemo: true, description: 'Edited demo' });
    const repository = createMemoryRepository({
      ...createEmptyAppData(),
      transactions: [realTransaction, editedDemo],
    });
    const { user } = renderRoute('/settings', { repository });

    await user.click(within(demoSection()).getByRole('button', { name: 'Clear demo data' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Clear demo data' }),
    );

    expect(repository.load().data.transactions).toEqual([realTransaction]);
  });
});
