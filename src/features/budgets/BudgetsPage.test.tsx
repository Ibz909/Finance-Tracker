import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getCategoriesByType } from '../../constants/categories';
import { createEmptyAppData } from '../../models/appData';
import type { Budget } from '../../models/budget';
import type { Transaction } from '../../models/transaction';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeBudget, makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

// renderRoute fixes "today" at 15 November 2026.

function expense(amountPence: number, categoryId: string, date = '2026-11-10'): Transaction {
  return makeTransaction({ type: 'expense', amountPence, categoryId, date });
}

function seeded({
  transactions = [],
  budgets = [],
}: {
  transactions?: Transaction[];
  budgets?: Budget[];
}) {
  return createMemoryRepository({ ...createEmptyAppData(), transactions, budgets });
}

/** A category budget's row, found by its heading. */
function row(name: string): HTMLElement {
  const item = screen.getByRole('heading', { level: 3, name }).closest('li');
  if (!item) throw new Error(`No row for ${name}`);
  return item;
}

function monthly() {
  return screen.getByRole('region', { name: 'Monthly budget' });
}

/** Opens a row's ⋯ menu and chooses an action. */
async function chooseAction(user: UserEvent, menu: string, action: 'Edit' | 'Delete') {
  await user.click(screen.getByRole('button', { name: menu }));
  await user.click(screen.getByRole('menuitem', { name: action }));
}

async function openAddBudget(user: UserEvent) {
  // The page's Add budget button (the only one before the dialog opens).
  const [button] = screen.getAllByRole('button', { name: 'Add budget' });
  if (!button) throw new Error('Add budget button not found');
  await user.click(button);
  return within(screen.getByRole('dialog', { name: 'Add budget' }));
}

const spending = [
  expense(95000, 'rent_housing'),
  expense(23000, 'food_groceries'), // 76.6% of £300 → nearing limit
  expense(11250, 'restaurants_takeaways'), // 112.5% of £100 → over
  expense(2000, 'transport'), // 25% of £80 → on track
  expense(50000, 'food_groceries', '2026-10-10'), // previous month: excluded
  makeTransaction({
    type: 'income',
    categoryId: 'salary',
    amountPence: 285000,
    date: '2026-11-01',
  }),
];

const budgets = [
  makeBudget({ id: 'overall', scope: 'overall', limitPence: 200000 }),
  makeBudget({ id: 'groceries', categoryId: 'food_groceries', limitPence: 30000 }),
  makeBudget({ id: 'eating', categoryId: 'restaurants_takeaways', limitPence: 10000 }),
  makeBudget({ id: 'transport', categoryId: 'transport', limitPence: 8000 }),
];

describe('Budgets page', () => {
  it('starts with an encouraging empty state', () => {
    renderRoute('/budgets');

    expect(screen.getByRole('heading', { name: 'No budgets yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add budget' })).toBeInTheDocument();
  });

  it('shows spending against each limit, with status in words and an accessible bar', () => {
    renderRoute('/budgets', { repository: seeded({ transactions: spending, budgets }) });

    const groceries = row('Food & Groceries');
    expect(groceries).toHaveTextContent('£230.00 of £300.00');
    expect(groceries).toHaveTextContent('£70.00 remaining');
    expect(groceries).toHaveTextContent('76%');
    expect(groceries).toHaveTextContent('Nearing limit');

    const eating = row('Restaurants & Takeaways');
    expect(eating).toHaveTextContent('£12.50 over');
    expect(eating).toHaveTextContent('Over budget');
    expect(within(eating).getByRole('progressbar')).toHaveAttribute('aria-valuetext', '112% used');
    expect(within(eating).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    expect(row('Transport')).toHaveTextContent('On track');
  });

  it('leads with what is left to spend, the days remaining and a daily allowance', () => {
    renderRoute('/budgets', { repository: seeded({ transactions: spending, budgets }) });

    const panel = monthly();
    // £2,000 − £1,312.50 spent. 15 November leaves 16 days, counting today.
    expect(within(panel).getByRole('heading', { name: 'Available to spend' })).toBeInTheDocument();
    expect(panel).toHaveTextContent('£687.50');
    expect(panel).toHaveTextContent('16 days remaining this month.');
    expect(panel).toHaveTextContent('On track');
    expect(
      within(panel).getByRole('img', { name: '65% of your monthly budget used, on track' }),
    ).toBeInTheDocument();
    // £687.50 ÷ 16 = £42.968…, rounded down so it never adds up to more than is left.
    expect(panel).toHaveTextContent('Daily allowance£42.96Per day to stay within budget');
    expect(panel).toHaveTextContent('Budget£2,000.00');
    expect(panel).toHaveTextContent('Spent£1,312.50');
  });

  it('shows how far over the monthly budget is, with no daily allowance', () => {
    const over = [...spending, expense(80000, 'shopping')];
    renderRoute('/budgets', { repository: seeded({ transactions: over, budgets }) });

    const panel = monthly();
    expect(within(panel).getByRole('heading', { name: 'Over budget by' })).toBeInTheDocument();
    expect(panel).toHaveTextContent('£112.50');
    expect(panel).toHaveTextContent('Over budget');
    expect(panel).toHaveTextContent('Daily allowance—You’re over your limit');
  });

  it('keeps the overall budget separate: it counts all spending, not the category limits', () => {
    renderRoute('/budgets', { repository: seeded({ transactions: spending, budgets }) });

    // £950 + £230 + £112.50 + £20 this month.
    expect(monthly()).toHaveTextContent('Spent£1,312.50');
    expect(monthly()).toHaveTextContent('Budget£2,000.00');
    expect(screen.getByText(/They aren’t added to your monthly budget/)).toBeInTheDocument();
  });

  it('follows the reporting month', async () => {
    const { user } = renderRoute('/budgets', {
      repository: seeded({ transactions: spending, budgets }),
    });

    await user.click(screen.getByRole('button', { name: 'Previous month, October 2026' }));

    expect(row('Food & Groceries')).toHaveTextContent('£500.00 of £300.00');
    expect(row('Transport')).toHaveTextContent('£0.00 of £80.00');
    expect(monthly()).toHaveTextContent('October 2026 has ended.');
    expect(monthly()).toHaveTextContent('Daily allowance—The month has ended');
  });

  it('spreads the allowance over the whole of a future month', async () => {
    const { user } = renderRoute('/budgets', { repository: seeded({ budgets }) });

    await user.click(screen.getByRole('button', { name: 'Next month, December 2026' }));

    expect(monthly()).toHaveTextContent('December 2026 hasn’t started yet.');
    // £2,000 over December's 31 days.
    expect(monthly()).toHaveTextContent('Daily allowance£64.51Per day across the month');
  });
});

describe('Adding budgets', () => {
  it('adds an overall budget, then a category budget', async () => {
    const repository = seeded({ transactions: spending });
    const { user } = renderRoute('/budgets', { repository });

    let form = await openAddBudget(user);
    expect(form.getByRole('radio', { name: /All spending/ })).toBeChecked();
    await user.type(form.getByLabelText('Monthly limit'), '2000');
    await user.click(form.getByRole('button', { name: 'Add budget' }));

    expect(monthly()).toHaveTextContent('Budget£2,000.00');

    form = await openAddBudget(user);
    expect(form.getByRole('radio', { name: /All spending/ })).toBeDisabled();
    expect(form.getByRole('radio', { name: /One category/ })).toBeChecked();
    await user.selectOptions(form.getByLabelText('Category'), 'food_groceries');
    await user.type(form.getByLabelText('Monthly limit'), '300');
    await user.click(form.getByRole('button', { name: 'Add budget' }));

    expect(row('Food & Groceries')).toHaveTextContent('£230.00 of £300.00');
    expect(repository.load().data.budgets).toEqual([
      expect.objectContaining({ scope: 'overall', limitPence: 200000, isDemo: false }),
      expect.objectContaining({
        scope: 'category',
        categoryId: 'food_groceries',
        limitPence: 30000,
      }),
    ]);
  });

  it('only offers categories that have no budget yet', async () => {
    const { user } = renderRoute('/budgets', { repository: seeded({ budgets }) });

    const form = await openAddBudget(user);
    const options = within(form.getByLabelText('Category'))
      .getAllByRole('option')
      .map((o) => o.getAttribute('value'));

    expect(options).not.toContain('food_groceries');
    expect(options).not.toContain('transport');
    expect(options).toContain('entertainment');
  });

  it('explains missing or invalid input and saves nothing', async () => {
    const repository = seeded({ budgets: [makeBudget({ scope: 'overall' })] });
    const { user } = renderRoute('/budgets', { repository });

    const form = await openAddBudget(user);
    await user.type(form.getByLabelText('Monthly limit'), '0');
    await user.click(form.getByRole('button', { name: 'Add budget' }));

    expect(form.getByLabelText('Category')).toHaveAccessibleDescription('Choose a category');
    expect(form.getByLabelText('Monthly limit')).toHaveAccessibleDescription(
      'Enter an amount greater than zero',
    );
    expect(repository.load().data.budgets).toHaveLength(1);
  });

  it('says so when everything already has a budget', async () => {
    const all = [
      makeBudget({ scope: 'overall' }),
      ...getCategoriesByType('expense').map((c) => makeBudget({ categoryId: c.id })),
    ];
    const { user } = renderRoute('/budgets', { repository: seeded({ budgets: all }) });

    const form = await openAddBudget(user);

    expect(form.getByText(/budget for every spending category/)).toBeInTheDocument();
  });
});

describe('Editing and deleting budgets', () => {
  it('changes the limit and recalculates the status', async () => {
    const repository = seeded({ transactions: spending, budgets });
    const { user } = renderRoute('/budgets', { repository });

    await chooseAction(user, 'Actions for Food & Groceries budget', 'Edit');
    const form = within(screen.getByRole('dialog', { name: 'Edit Food & Groceries budget' }));
    expect(form.getByLabelText('Monthly limit')).toHaveValue('300.00');
    await user.clear(form.getByLabelText('Monthly limit'));
    await user.type(form.getByLabelText('Monthly limit'), '500');
    await user.click(form.getByRole('button', { name: 'Save changes' }));

    expect(row('Food & Groceries')).toHaveTextContent('£230.00 of £500.00');
    expect(row('Food & Groceries')).toHaveTextContent('On track');
    expect(repository.load().data.budgets.find((b) => b.id === 'groceries')?.limitPence).toBe(
      50000,
    );
  });

  it('deletes a budget after confirmation, leaving transactions alone', async () => {
    const repository = seeded({ transactions: spending, budgets });
    const { user } = renderRoute('/budgets', { repository });

    await chooseAction(user, 'Actions for Transport budget', 'Delete');
    const confirm = screen.getByRole('dialog', { name: 'Delete Transport budget?' });
    expect(confirm).toHaveAccessibleDescription(
      'This removes the £80.00 monthly limit. Your transactions are not affected.',
    );
    await user.click(within(confirm).getByRole('button', { name: 'Delete budget' }));

    expect(screen.queryByRole('heading', { name: 'Transport' })).not.toBeInTheDocument();
    expect(repository.load().data.budgets.map((b) => b.id)).not.toContain('transport');
    expect(repository.load().data.transactions).toHaveLength(spending.length);
  });
});

describe('Overview monthly budget panel', () => {
  it('shows what is left to spend and which categories need attention', () => {
    renderRoute('/', { repository: seeded({ transactions: spending, budgets }) });

    const panel = screen.getByRole('region', { name: 'Monthly budget' });
    expect(panel).toHaveTextContent('Remaining to spend£687.50');
    expect(panel).toHaveTextContent('£1,312.50 spent£2,000.00 limit');
    expect(panel).toHaveTextContent('You’re on track for your monthly limit. 65% used.');
    // Groceries is nearing its limit and eating out is over; transport is fine.
    expect(panel).toHaveTextContent(
      '1 category budget is close to its limit, and 1 category budget is over.',
    );
    expect(within(panel).getByRole('progressbar')).toHaveAttribute('aria-valuetext', '65% used');
    expect(within(panel).getByRole('link', { name: 'View budgets' })).toHaveAttribute(
      'href',
      '/budgets',
    );
  });

  it('invites setting up a budget when there are none', () => {
    renderRoute('/', { repository: seeded({ transactions: spending }) });

    const panel = screen.getByRole('region', { name: 'Monthly budget' });
    expect(panel).toHaveTextContent('No budgets yet');
    expect(within(panel).getByRole('link', { name: 'Set up a budget' })).toBeInTheDocument();
  });
});
