import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { RecurringSchedule } from '../../models/recurring';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeSchedule, makeTransaction } from '../../test/fixtures';
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

async function rowAction(user: UserEvent, name: string, action: string) {
  await user.click(screen.getByRole('button', { name: `Actions for ${name}` }));
  await user.click(screen.getByRole('menuitem', { name: action }));
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

    await rowAction(user, 'Gym', 'Pause');
    expect(
      within(screen.getByRole('region', { name: 'Paused or ended' })).getByText('Paused'),
    ).toBeInTheDocument();

    await rowAction(user, 'Gym', 'Resume');
    expect(
      within(screen.getByRole('region', { name: 'Active' })).getByText('Next 1 Dec 2026'),
    ).toBeInTheDocument();
  });

  it('edits the amount without changing when the next payment is', async () => {
    const repository = seeded(
      makeSchedule({ id: 's1', description: 'Gym', nextDueDate: '2026-12-01' }),
    );
    const { user } = renderRoute('/recurring', { repository });

    await rowAction(user, 'Gym', 'Edit');
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

    await rowAction(user, 'Gym', 'Delete');
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

describe('Recurring overview', () => {
  const rent = makeSchedule({
    id: 'rent',
    description: 'Rent',
    amountPence: 95000,
    startDate: '2026-09-01',
    nextDueDate: '2026-12-01',
  });
  const salary = makeSchedule({
    id: 'salary',
    type: 'income',
    categoryId: 'salary',
    description: 'Salary',
    amountPence: 265000,
    startDate: '2026-09-28',
    nextDueDate: '2026-11-28',
  });
  const paused = makeSchedule({
    id: 'gym',
    description: 'Gym',
    amountPence: 3000,
    startDate: '2026-09-20',
    nextDueDate: '2026-11-20',
    paused: true,
  });
  const repository = () =>
    createMemoryRepository({
      ...createEmptyAppData(),
      recurringSchedules: [rent, salary, paused],
      transactions: [
        makeTransaction({
          description: 'Rent',
          amountPence: 95000,
          date: '2026-11-01',
          categoryId: 'rent_housing',
          recurringScheduleId: 'rent',
        }),
      ],
    });

  it('sums the month: paid so far plus still to come, never a paused item', () => {
    renderRoute('/recurring', { repository: repository() });

    const summary = screen.getByLabelText('Recurring money, November 2026');
    expect(summary).toHaveTextContent('Recurring income£2,650.001 due');
    expect(summary).toHaveTextContent('Recurring expenses£950.001 paid');
    expect(summary).not.toHaveTextContent('Net recurring');
    expect(summary).toHaveTextContent('Active items21 paused or ended');
  });

  it('marks payment days on the calendar and lists a chosen day’s payments', async () => {
    const { user } = renderRoute('/recurring', { repository: repository() });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Today, Sunday 15 November 2026' }),
    ).toBeVisible();
    expect(screen.getByText('No recurring payments on this day.')).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Sunday 1 November 2026, 1 payment, £950.00 out' }),
    );
    const day = within(screen.getByRole('region', { name: 'Sunday 1 November 2026' }));
    expect(day.getByText('Rent')).toBeVisible();
    expect(day.getByText('Paid')).toBeVisible();
    expect(day.getByText('Rent & Housing · Monthly')).toBeVisible();
  });

  it('follows the shared month, and the summary follows the calendar', async () => {
    const { user } = renderRoute('/recurring', { repository: repository() });

    await user.click(screen.getByRole('button', { name: 'Next month, December 2026' }));

    expect(screen.getByRole('grid', { name: 'Recurring payments, December 2026' })).toBeVisible();
    // Outside the current month the first payment day is chosen.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tuesday 1 December 2026' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Recurring money, December 2026')).toHaveTextContent(
      'Recurring income£2,650.00',
    );

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    await user.click(within(nav).getByRole('link', { name: 'Overview' }));
    expect(
      screen.getByRole('region', { name: 'Net cash flow, December 2026' }),
    ).toBeInTheDocument();
  });

  it('lists what is coming up next, soonest first', () => {
    renderRoute('/recurring', { repository: repository() });

    const upcoming = within(screen.getByRole('region', { name: 'Upcoming' }));
    const rows = upcoming.getAllByRole('listitem').map((row) => row.textContent);
    expect(rows.slice(0, 3)).toEqual([
      'Sat 28 NovSalarySalary · Monthly+£2,650.00, income',
      'Tue 1 DecRentRent & Housing · Monthly−£950.00, expense',
      'Mon 28 DecSalarySalary · Monthly+£2,650.00, income',
    ]);
  });
});
