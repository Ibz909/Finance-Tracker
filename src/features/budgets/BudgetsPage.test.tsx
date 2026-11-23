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

function card(name: string) {
  return screen.getByRole('region', { name });
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

    const groceries = card('Food & Groceries');
    expect(groceries).toHaveTextContent('£230.00 spent of £300.00');
    expect(groceries).toHaveTextContent('£70.00 left');
    expect(groceries).toHaveTextContent('76% used');
    expect(groceries).toHaveTextContent('Nearing limit');

    const eating = card('Restaurants & Takeaways');
    expect(eating).toHaveTextContent('£12.50 over');
    expect(eating).toHaveTextContent('Over budget');
    expect(within(eating).getByRole('progressbar')).toHaveAttribute('aria-valuetext', '112% used');
    expect(within(eating).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    expect(card('Transport')).toHaveTextContent('On track');
  });

  it('keeps the overall budget separate: it counts all spending, not the category limits', () => {
    renderRoute('/budgets', { repository: seeded({ transactions: spending, budgets }) });

    // £950 + £230 + £112.50 + £20 this month.
    expect(card('All spending')).toHaveTextContent('£1,312.50 spent of £2,000.00');
    expect(screen.getByText(/They aren’t added to your monthly budget/)).toBeInTheDocument();
  });

  it('follows the reporting month', async () => {
    const { user } = renderRoute('/budgets', {
      repository: seeded({ transactions: spending, budgets }),
    });

    await user.click(screen.getByRole('button', { name: 'Previous month, October 2026' }));

    expect(card('Food & Groceries')).toHaveTextContent('£500.00 spent of £300.00');
    expect(card('Transport')).toHaveTextContent('£0.00 spent');
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

    expect(card('All spending')).toHaveTextContent('spent of £2,000.00');

    form = await openAddBudget(user);
    expect(form.getByRole('radio', { name: /All spending/ })).toBeDisabled();
    expect(form.getByRole('radio', { name: /One category/ })).toBeChecked();
    await user.selectOptions(form.getByLabelText('Category'), 'food_groceries');
    await user.type(form.getByLabelText('Monthly limit'), '300');
    await user.click(form.getByRole('button', { name: 'Add budget' }));

    expect(card('Food & Groceries')).toHaveTextContent('£230.00 spent of £300.00');
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

    await user.click(screen.getByRole('button', { name: 'Edit Food & Groceries budget' }));
    const form = within(screen.getByRole('dialog', { name: 'Edit Food & Groceries budget' }));
    expect(form.getByLabelText('Monthly limit')).toHaveValue('300.00');
    await user.clear(form.getByLabelText('Monthly limit'));
    await user.type(form.getByLabelText('Monthly limit'), '500');
    await user.click(form.getByRole('button', { name: 'Save changes' }));

    expect(card('Food & Groceries')).toHaveTextContent('£230.00 spent of £500.00');
    expect(card('Food & Groceries')).toHaveTextContent('On track');
    expect(repository.load().data.budgets.find((b) => b.id === 'groceries')?.limitPence).toBe(
      50000,
    );
  });

  it('deletes a budget after confirmation, leaving transactions alone', async () => {
    const repository = seeded({ transactions: spending, budgets });
    const { user } = renderRoute('/budgets', { repository });

    await user.click(screen.getByRole('button', { name: 'Delete Transport budget' }));
    const confirm = screen.getByRole('dialog', { name: 'Delete Transport budget?' });
    expect(confirm).toHaveAccessibleDescription(
      'This removes the £80.00 monthly limit. Your transactions are not affected.',
    );
    await user.click(within(confirm).getByRole('button', { name: 'Delete budget' }));

    expect(screen.queryByRole('region', { name: 'Transport' })).not.toBeInTheDocument();
    expect(repository.load().data.budgets.map((b) => b.id)).not.toContain('transport');
    expect(repository.load().data.transactions).toHaveLength(spending.length);
  });
});

describe('Dashboard budget overview', () => {
  it('shows the overall budget then the categories closest to their limits', () => {
    renderRoute('/', { repository: seeded({ transactions: spending, budgets }) });

    const overview = screen.getByRole('region', { name: 'Budget progress' });
    const rows = within(overview).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('All spending'),
      expect.stringContaining('Restaurants & Takeaways'),
      expect.stringContaining('Food & Groceries'),
      expect.stringContaining('Transport'),
    ]);
    expect(rows[1]).toHaveTextContent('Over budget');
    expect(within(overview).getByRole('link', { name: 'All budgets' })).toHaveAttribute(
      'href',
      '/budgets',
    );
  });

  it('invites setting up a budget when there are none', () => {
    renderRoute('/', { repository: seeded({ transactions: spending }) });

    const overview = screen.getByRole('region', { name: 'Budget progress' });
    expect(overview).toHaveTextContent('No budgets yet');
    expect(within(overview).getByRole('link', { name: 'Set up a budget' })).toBeInTheDocument();
  });
});
