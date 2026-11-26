import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateDemoTransactions } from '../../features/demo/demoData';
import { createEmptyAppData } from '../../models/appData';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

const NOW = new Date(2026, 10, 15, 12, 0);
const DEMO_COUNT = generateDemoTransactions(NOW).length;

const realTransaction = makeTransaction({
  id: 'real-1',
  description: 'My real purchase',
  date: '2026-11-10',
  isDemo: false,
});

function demoSwitch() {
  return screen.getByRole('switch', { name: 'Demo data' });
}

function notifications() {
  return screen.getByRole('status', { name: 'Notifications' });
}

beforeEach(() => {
  // Fake only the clock, so generated demo data is the same on every run.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Demo data switch', () => {
  it('starts off when there is no demo data', () => {
    renderRoute('/', { repository: createMemoryRepository() });

    expect(demoSwitch()).not.toBeChecked();
    expect(demoSwitch()).toHaveTextContent('Demo data:Off');
  });

  it('sits just before the theme button in the top bar', () => {
    renderRoute('/');

    const theme = screen.getByRole('button', { name: /^Switch to (light|dark) theme$/ });
    expect(demoSwitch().nextElementSibling).toBe(theme);
  });

  it('turns demo data on without touching real data', async () => {
    const repository = createMemoryRepository({
      ...createEmptyAppData(),
      transactions: [realTransaction],
    });
    const { user } = renderRoute('/transactions', { repository });

    await user.click(demoSwitch());

    expect(demoSwitch()).toBeChecked();
    expect(demoSwitch()).toHaveTextContent('Demo data:On');
    const saved = repository.load().data.transactions;
    expect(saved).toContainEqual(realTransaction);
    expect(saved.filter((t) => t.isDemo)).toHaveLength(DEMO_COUNT);
    expect(notifications()).toHaveTextContent('Demo data turned on');
    expect(screen.getByRole('link', { name: 'Manage demo data' })).toBeInTheDocument();
  });

  it('is on when demo data is already loaded, and turning it off removes only demo data', async () => {
    const repository = createMemoryRepository({
      ...createEmptyAppData(),
      transactions: [realTransaction, ...generateDemoTransactions(NOW)],
    });
    const { user } = renderRoute('/transactions', { repository });
    expect(demoSwitch()).toBeChecked();

    await user.click(demoSwitch());

    expect(demoSwitch()).not.toBeChecked();
    expect(repository.load().data.transactions).toEqual([realTransaction]);
    expect(notifications()).toHaveTextContent('Demo data turned off');
    expect(screen.queryByRole('link', { name: 'Manage demo data' })).not.toBeInTheDocument();
  });

  it('works from the keyboard', async () => {
    const repository = createMemoryRepository();
    const { user } = renderRoute('/', { repository });

    demoSwitch().focus();
    await user.keyboard(' ');
    expect(demoSwitch()).toBeChecked();

    await user.keyboard('{Enter}');
    expect(demoSwitch()).not.toBeChecked();
    expect(repository.load().data.transactions).toEqual([]);
  });
});
