import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { GoalContribution, SavingsGoal } from '../../models/savings';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeContribution, makeGoal, makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

// renderRoute fixes "today" at 15 November 2026.

function seeded(goals: SavingsGoal[], contributions: GoalContribution[] = []) {
  return createMemoryRepository({
    ...createEmptyAppData(),
    savingsGoals: goals,
    goalContributions: contributions,
  });
}

const card = (name: string) => within(screen.getByRole('region', { name }));

async function contribute(user: UserEvent, button: string, dialogName: string, amount: string) {
  await user.click(screen.getByRole('button', { name: button }));
  const dialog = within(screen.getByRole('dialog', { name: dialogName }));
  await user.type(dialog.getByLabelText('Amount'), amount);
  await user.click(
    dialog.getByRole('button', { name: dialogName.startsWith('Add') ? 'Add money' : 'Withdraw' }),
  );
  return dialog;
}

describe('Savings goals page', () => {
  it('adds a goal and says how much to save each month', async () => {
    const repository = seeded([]);
    const { user } = renderRoute('/savings', { repository });

    await user.click(screen.getByRole('button', { name: 'Add savings goal' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Add savings goal' }));
    await user.type(dialog.getByLabelText('Name'), 'Holiday');
    await user.type(dialog.getByLabelText('Target amount'), '1,200');
    await user.type(dialog.getByLabelText(/Target date/), '2027-03-31');
    await user.click(dialog.getByRole('button', { name: 'Add goal' }));

    // Nov, Dec, Jan, Feb, Mar: £1,200 / 5 = £240.
    expect(
      card('Holiday').getByText('Save £240.00 a month to reach it by March 2027.'),
    ).toBeVisible();
    expect(card('Holiday').getByText('In progress')).toBeVisible();
    expect(repository.saved?.savingsGoals).toHaveLength(1);
  });

  it('validates the goal form with one clear message per field', async () => {
    const { user } = renderRoute('/savings');

    await user.click(screen.getByRole('button', { name: 'Add savings goal' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Add savings goal' }));
    await user.click(dialog.getByRole('button', { name: 'Add goal' }));

    expect(dialog.getByLabelText('Name')).toHaveAccessibleDescription('Enter a name for the goal');
    expect(dialog.getByLabelText('Target amount')).toHaveAccessibleDescription(/enter an amount/i);
    expect(dialog.getByLabelText('Name')).toHaveFocus();
  });

  it('records deposits and withdrawals and updates progress', async () => {
    const { user } = renderRoute('/savings', {
      repository: seeded([
        makeGoal({ name: 'Holiday', targetPence: 120000, targetDate: '2027-03-31' }),
      ]),
    });

    await contribute(user, 'Add money to Holiday', 'Add money to Holiday', '300');
    expect(card('Holiday').getByText('£300.00')).toBeVisible();
    expect(card('Holiday').getByText('£900.00 to go')).toBeVisible();
    expect(card('Holiday').getByRole('progressbar')).toHaveAttribute('aria-valuetext', '25% saved');
    expect(card('Holiday').getByText(/Save £180.00 a month/)).toBeVisible();

    await contribute(user, 'Withdraw from Holiday', 'Withdraw from Holiday', '50');
    expect(card('Holiday').getByText('£250.00')).toBeVisible();
    expect(
      screen.getByText((_, el) => el?.textContent === '£250.00 saved across 1 goal.', {
        selector: 'p',
      }),
    ).toBeVisible();
  });

  it('refuses to withdraw more than the goal holds', async () => {
    const { user } = renderRoute('/savings', {
      repository: seeded(
        [makeGoal({ id: 'g', name: 'Car' })],
        [makeContribution('g', { amountPence: 30000 })],
      ),
    });

    const dialog = await contribute(user, 'Withdraw from Car', 'Withdraw from Car', '300.01');

    expect(dialog.getByLabelText('Amount')).toHaveAccessibleDescription(
      'You can withdraw up to £300.00',
    );
  });

  it('disables withdrawing from an empty goal', () => {
    renderRoute('/savings', { repository: seeded([makeGoal({ name: 'Car' })]) });
    expect(screen.getByRole('button', { name: 'Withdraw from Car' })).toBeDisabled();
  });

  it('marks reached and overdue goals in words', () => {
    renderRoute('/savings', {
      repository: seeded(
        [
          makeGoal({ id: 'a', name: 'Laptop', targetPence: 10000 }),
          makeGoal({ id: 'b', name: 'Festival', targetDate: '2026-08-01' }),
        ],
        [makeContribution('a', { amountPence: 10000 })],
      ),
    });

    expect(card('Laptop').getByText('Goal reached')).toBeVisible();
    expect(card('Laptop').getByText('Target reached')).toBeVisible();
    expect(card('Festival').getByText('Target date passed')).toBeVisible();
  });

  it('keeps history consistent when deleting entries', async () => {
    const deposit = makeContribution('g', { amountPence: 10000, date: '2026-10-01' });
    const withdrawal = makeContribution('g', {
      kind: 'withdrawal',
      amountPence: 6000,
      date: '2026-11-01',
    });
    const { user } = renderRoute('/savings', {
      repository: seeded([makeGoal({ id: 'g', name: 'Car' })], [deposit, withdrawal]),
    });

    await user.click(card('Car').getByText('History (2)'));
    await user.click(
      screen.getByRole('button', { name: 'Delete deposit of £100.00 on 1 Oct 2026' }),
    );
    await user.click(screen.getByRole('button', { name: 'Delete entry' }));
    expect(screen.getByText(/money has been withdrawn/)).toBeVisible();
    expect(card('Car').getByText('History (2)')).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Delete withdrawal of £60.00 on 1 Nov 2026' }),
    );
    await user.click(screen.getByRole('button', { name: 'Delete entry' }));
    expect(card('Car').getByText('History (1)')).toBeVisible();
    expect(card('Car').getByText('£100.00')).toBeVisible();
  });

  it('deletes a goal and its history after confirmation', async () => {
    const repository = seeded([makeGoal({ id: 'g', name: 'Car' })], [makeContribution('g')]);
    const { user } = renderRoute('/savings', { repository });

    await user.click(screen.getByRole('button', { name: 'Delete Car' }));
    await user.click(screen.getByRole('button', { name: 'Delete goal' }));

    expect(repository.saved?.savingsGoals).toEqual([]);
    expect(repository.saved?.goalContributions).toEqual([]);
    expect(screen.getByRole('heading', { name: 'No savings goals yet' })).toBeVisible();
  });
});

describe('Dashboard savings panel', () => {
  it('shows the total saved and goal progress', () => {
    const repository = createMemoryRepository({
      ...createEmptyAppData(),
      transactions: [makeTransaction({ date: '2026-11-02' })],
      savingsGoals: [makeGoal({ id: 'g', name: 'Holiday', targetPence: 120000 })],
      goalContributions: [makeContribution('g', { amountPence: 30000 })],
    });
    renderRoute('/', { repository });

    const panel = within(screen.getByRole('region', { name: 'Savings goals' }));
    expect(panel.getByText('£300.00 of £1,200.00 · 25%')).toBeVisible();
    expect(panel.getByRole('link', { name: 'All goals' })).toHaveAttribute('href', '/savings');
  });
});
