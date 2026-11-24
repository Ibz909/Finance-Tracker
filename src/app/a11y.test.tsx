import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  generateDemoBudgets,
  generateDemoGoals,
  generateDemoTransactions,
} from '../features/demo/demoData';
import { createEmptyAppData } from '../models/appData';
import { createMemoryRepository } from '../services/storage/memoryRepository';
import { expectNoAccessibilityViolations } from '../test/axe';
import { makeSchedule } from '../test/fixtures';
import { renderRoute, TEST_NOW } from '../test/renderRoute';

/** The demo dataset plus a recurring item, so every page has real content. */
function demoRepository() {
  const { goals, contributions } = generateDemoGoals(TEST_NOW);
  return createMemoryRepository({
    ...createEmptyAppData(),
    transactions: generateDemoTransactions(TEST_NOW),
    budgets: generateDemoBudgets(TEST_NOW),
    recurringSchedules: [makeSchedule({ description: 'Gym', nextDueDate: '2026-12-01' })],
    savingsGoals: goals,
    goalContributions: contributions,
  });
}

const PAGES = [
  '/',
  '/transactions',
  '/recurring',
  '/budgets',
  '/analytics',
  '/savings',
  '/settings',
  '/no-such-page',
];

describe('Accessibility (axe-core, WCAG 2.2 A/AA)', () => {
  describe.each([
    ['empty', () => createMemoryRepository()],
    ['with demo data', demoRepository],
  ])('pages, %s', (_state, repository) => {
    it.each(PAGES)('%s', async (path) => {
      renderRoute(path, { repository: repository() });
      await expectNoAccessibilityViolations();
    });
  });

  it.each([
    ['/', 'Add transaction', 'Add transaction'],
    ['/budgets', 'Add budget', 'Add budget'],
    ['/recurring', 'Add recurring transaction', 'Add recurring transaction'],
    ['/savings', 'Add savings goal', 'Add savings goal'],
    ['/savings', 'Add money to Summer holiday', 'Add money to Summer holiday'],
    ['/settings', 'Reset all data', 'Delete all data?'],
    ['/transactions', 'Delete Monthly salary', 'Delete “Monthly salary”?'],
  ])('%s: the “%s” dialog', async (path, button, dialogName) => {
    const { user } = renderRoute(path, { repository: demoRepository() });
    const [opener] = screen.getAllByRole('button', { name: button });
    if (!opener) throw new Error(`No “${button}” button`);
    await user.click(opener);
    await screen.findByRole('dialog', { name: dialogName });
    await expectNoAccessibilityViolations();
  });

  it('a form showing validation errors', async () => {
    const { user } = renderRoute('/', { repository: demoRepository() });
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Add transaction' }));
    await user.click(dialog.getByRole('button', { name: 'Add transaction' }));
    await dialog.findByText('Enter a description');
    await expectNoAccessibilityViolations();
  });
});

describe('The axe check itself', () => {
  it('fails on a real problem, so the checks above are meaningful', async () => {
    const { container } = render(
      <main>
        <button type="button" />
      </main>,
    );
    await expect(expectNoAccessibilityViolations(container)).rejects.toThrow(/button-name/);
  });
});
