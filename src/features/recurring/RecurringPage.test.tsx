import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { RecurringSchedule } from '../../models/recurring';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeSchedule } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

// renderRoute fixes "today" at 15 November 2026.

function seeded(...recurringSchedules: RecurringSchedule[]) {
  return createMemoryRepository({ ...createEmptyAppData(), recurringSchedules });
}

async function openAddDialog(user: UserEvent) {
  const [button] = screen.getAllByRole('button', { name: 'Add recurring transaction' });
  if (!button) throw new Error('Add button not found');
  await user.click(button);
  return within(screen.getByRole('dialog', { name: 'Add recurring transaction' }));
}

async function fillForm(
  user: UserEvent,
  dialog: Awaited<ReturnType<typeof openAddDialog>>,
  { amount, startDate }: { amount: string; startDate: string },
) {
  await user.type(dialog.getByLabelText('Amount'), amount);
  await user.selectOptions(dialog.getByLabelText('Category'), 'rent_housing');
  await user.type(dialog.getByLabelText('Description'), 'Rent');
  await user.clear(dialog.getByLabelText('First payment'));
  await user.type(dialog.getByLabelText('First payment'), startDate);
}

describe('Recurring page', () => {
  it('explains the feature when there is nothing set up', () => {
    renderRoute('/recurring');
    expect(
      screen.getByRole('heading', { name: 'No recurring transactions yet' }),
    ).toBeInTheDocument();
  });

  it('adds a schedule and back-fills payments already due', async () => {
    const repository = seeded();
    const { user } = renderRoute('/recurring', { repository });
    const dialog = await openAddDialog(user);

    await fillForm(user, dialog, { amount: '950', startDate: '2026-10-01' });
    await user.click(dialog.getByRole('button', { name: 'Add recurring transaction' }));

    expect(screen.getByText('Recurring transaction added')).toBeInTheDocument();
    const active = within(screen.getByRole('region', { name: 'Active' }));
    expect(active.getByText('Rent')).toBeInTheDocument();
    expect(active.getByText('Next 1 Dec 2026')).toBeInTheDocument();
    expect(repository.saved?.transactions.map((t) => t.date)).toEqual(['2026-10-01', '2026-11-01']);
  });

  it('shows clear errors and refuses a start date over 12 months ago', async () => {
    const { user } = renderRoute('/recurring');
    const dialog = await openAddDialog(user);

    await user.click(dialog.getByRole('button', { name: 'Add recurring transaction' }));
    expect(dialog.getByLabelText('Amount')).toHaveAccessibleDescription(/enter an amount/i);
    expect(dialog.getByLabelText('Category')).toHaveAccessibleDescription('Choose a category');

    await fillForm(user, dialog, { amount: '950', startDate: '2025-11-01' });
    await user.click(dialog.getByRole('button', { name: 'Add recurring transaction' }));
    expect(dialog.getByLabelText('First payment')).toHaveAccessibleDescription(
      'The start date can be at most 12 months ago',
    );
  });

  it('rejects a last payment before the first', async () => {
    const { user } = renderRoute('/recurring');
    const dialog = await openAddDialog(user);

    await fillForm(user, dialog, { amount: '950', startDate: '2026-12-01' });
    await user.type(dialog.getByLabelText(/Last payment/), '2026-11-30');
    await user.click(dialog.getByRole('button', { name: 'Add recurring transaction' }));

    expect(dialog.getByLabelText(/Last payment/)).toHaveAccessibleDescription(
      'The end date can’t be before the start date',
    );
  });

  it('pauses and resumes a schedule', async () => {
    const { user } = renderRoute('/recurring', {
      repository: seeded(makeSchedule({ description: 'Gym', nextDueDate: '2026-12-01' })),
    });

    await user.click(screen.getByRole('button', { name: 'Pause Gym' }));
    expect(
      within(screen.getByRole('region', { name: 'Paused or ended' })).getByText('Paused'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resume Gym' }));
    expect(
      within(screen.getByRole('region', { name: 'Active' })).getByText('Next 1 Dec 2026'),
    ).toBeInTheDocument();
  });

  it('edits the amount without changing when the next payment is', async () => {
    const repository = seeded(
      makeSchedule({ id: 's1', description: 'Gym', nextDueDate: '2026-12-01' }),
    );
    const { user } = renderRoute('/recurring', { repository });

    await user.click(screen.getByRole('button', { name: 'Edit Gym' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Edit recurring transaction' }));
    await user.clear(dialog.getByLabelText('Amount'));
    await user.type(dialog.getByLabelText('Amount'), '40');
    await user.click(dialog.getByRole('button', { name: 'Save changes' }));

    expect(repository.saved?.recurringSchedules[0]).toMatchObject({
      amountPence: 4000,
      nextDueDate: '2026-12-01',
    });
  });

  it('deletes a schedule after confirmation, keeping its past transactions', async () => {
    const repository = seeded(makeSchedule({ description: 'Gym', nextDueDate: '2026-11-01' }));
    const { user } = renderRoute('/recurring', { repository });

    await user.click(screen.getByRole('button', { name: 'Delete Gym' }));
    await user.click(screen.getByRole('button', { name: 'Delete recurring transaction' }));

    expect(repository.saved?.recurringSchedules).toEqual([]);
    expect(repository.saved?.transactions).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: 'No recurring transactions yet' }),
    ).toBeInTheDocument();
  });
});

describe('Catching up when the app opens', () => {
  it('adds due payments, saves them, says so, and labels them', async () => {
    const repository = seeded(makeSchedule({ startDate: '2026-10-01', nextDueDate: '2026-10-01' }));
    const { user } = renderRoute('/transactions?month=all', { repository });

    expect(
      screen.getByRole('status', { name: /2 recurring transactions were added/ }),
    ).toBeVisible();
    expect(repository.saved?.transactions).toHaveLength(2);
    expect(repository.saved?.recurringSchedules[0]?.nextDueDate).toBe('2026-12-01');
    // One label per added transaction row.
    const recurringRows = within(screen.getByRole('main'))
      .getAllByRole('row')
      .filter((row) => row.textContent.includes('Recurring'));
    expect(recurringRows).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(screen.queryByText(/recurring transactions were added/)).not.toBeInTheDocument();
  });

  it('says nothing when no payment was due', () => {
    renderRoute('/', { repository: seeded(makeSchedule({ nextDueDate: '2026-12-01' })) });
    expect(screen.queryByText(/were added/)).not.toBeInTheDocument();
  });
});
