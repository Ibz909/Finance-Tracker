import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { createEmptyAppData } from '../../models/appData';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeBudget, makeGoal, makeSchedule, makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

function fullRepository() {
  return createMemoryRepository({
    ...createEmptyAppData(),
    transactions: [
      makeTransaction({ date: '2026-11-02' }),
      makeTransaction({ date: '2026-11-03' }),
    ],
    budgets: [makeBudget()],
    recurringSchedules: [makeSchedule({ nextDueDate: '2026-12-01' })],
    savingsGoals: [makeGoal()],
  });
}

async function openResetDialog(user: ReturnType<typeof renderRoute>['user']) {
  await user.click(screen.getByRole('button', { name: 'Reset all data' }));
  return within(screen.getByRole('dialog', { name: 'Delete all data?' }));
}

let downloadedNames: string[] = [];
beforeEach(() => {
  downloadedNames = [];
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloadedNames.push(this.download);
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Resetting all data', () => {
  it('says exactly what will be deleted', async () => {
    const { user } = renderRoute('/settings', { repository: fullRepository() });
    const dialog = await openResetDialog(user);

    expect(dialog.getByText(/permanently deletes/)).toHaveTextContent(
      'This permanently deletes 2 transactions, 1 budget, 1 recurring transaction and 1 savings goal, including savings history, and any backup copies kept from damaged data. Your theme choice is kept.',
    );
  });

  it('only enables the delete button once “delete” is typed', async () => {
    const { user } = renderRoute('/settings', { repository: fullRepository() });
    const dialog = await openResetDialog(user);
    const confirm = dialog.getByRole('button', { name: 'Delete all data' });
    const input = dialog.getByLabelText('Confirm');

    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription('Type “delete” to confirm.');
    expect(confirm).toBeDisabled();

    await user.type(input, 'delet');
    expect(confirm).toBeDisabled();
    // Pressing Enter before the word is complete must not reset anything.
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Delete all data?' })).toBeVisible();

    await user.type(input, 'e');
    expect(confirm).toBeEnabled();
  });

  it('changes nothing when cancelled', async () => {
    const repository = fullRepository();
    const { user } = renderRoute('/settings', { repository });
    const dialog = await openResetDialog(user);

    await user.type(dialog.getByLabelText('Confirm'), 'delete');
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));

    expect(repository.saved?.transactions).toHaveLength(2);
    expect(repository.backupsCleared).toBe(0);
  });

  it('offers to export transactions first', async () => {
    const { user } = renderRoute('/settings', { repository: fullRepository() });
    const dialog = await openResetDialog(user);

    await user.click(dialog.getByRole('button', { name: 'Export transactions first' }));

    expect(downloadedNames).toEqual(['finance-tracker-transactions-2026-11-15.csv']);
    // Exporting doesn't close the dialog or delete anything.
    expect(screen.getByRole('dialog', { name: 'Delete all data?' })).toBeVisible();
  });

  it('deletes everything and backups, keeps the theme, and returns to the dashboard', async () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'dark');
    const repository = fullRepository();
    const { user, router } = renderRoute('/settings', { repository });
    const dialog = await openResetDialog(user);

    await user.type(dialog.getByLabelText('Confirm'), ' DELETE ');
    await user.click(dialog.getByRole('button', { name: 'Delete all data' }));

    expect(repository.saved).toEqual(createEmptyAppData());
    expect(repository.backupsCleared).toBe(1);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { name: 'Welcome to Finance Tracker' })).toBeVisible();
    expect(screen.getByText('All data deleted')).toBeInTheDocument();
  });

  it('disables reset when there is nothing to delete', () => {
    renderRoute('/settings');
    expect(screen.getByRole('button', { name: 'Reset all data' })).toBeDisabled();
    expect(screen.getByText('There’s no data to reset.')).toBeVisible();
  });
});
