import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { Transaction } from '../../models/transaction';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

const data: Transaction[] = [
  makeTransaction({
    id: 't1',
    description: 'TESCO Express',
    amountPence: 1250,
    date: '2026-11-03',
    categoryId: 'food_groceries',
  }),
  makeTransaction({
    id: 't2',
    description: 'Rent',
    amountPence: 95000,
    date: '2026-11-01',
    categoryId: 'rent_housing',
  }),
  makeTransaction({
    id: 't3',
    type: 'income',
    description: 'Salary',
    amountPence: 285000,
    date: '2026-10-28',
    categoryId: 'salary',
  }),
  makeTransaction({
    id: 't4',
    description: 'Tesco meal deal',
    amountPence: 395,
    date: '2026-10-15',
    categoryId: 'restaurants_takeaways',
  }),
  makeTransaction({
    id: 't5',
    description: 'Train to Leeds',
    amountPence: 4599,
    date: '2026-09-20',
    categoryId: 'transport',
  }),
];

function seeded() {
  return createMemoryRepository({ ...createEmptyAppData(), transactions: data });
}

function shownDescriptions() {
  const region = screen.getByRole('table');
  return within(region)
    .queryAllByRole('row')
    .filter((row) => row.querySelector('td'))
    .map((row) => row.querySelector('td p')?.textContent);
}

function count() {
  return screen.getByText(/transactions?$/, { selector: 'p' }).textContent;
}

describe('Transaction search and filters', () => {
  it('shows everything, newest first, with a plain count by default', () => {
    renderRoute('/transactions?month=all', { repository: seeded() });

    expect(shownDescriptions()).toEqual([
      'TESCO Express',
      'Rent',
      'Salary',
      'Tesco meal deal',
      'Train to Leeds',
    ]);
    expect(count()).toBe('5 transactions');
    expect(screen.queryByRole('button', { name: 'Reset filters' })).not.toBeInTheDocument();
  });

  it('searches descriptions ignoring case and keeps the search in the URL', async () => {
    const { user, router } = renderRoute('/transactions?month=all', { repository: seeded() });

    await user.type(screen.getByLabelText('Search transactions'), '  tesco');

    expect(shownDescriptions()).toEqual(['TESCO Express', 'Tesco meal deal']);
    expect(count()).toBe('Showing 2 of 5 transactions');
    expect(router.state.location.search).toBe('?month=all&q=++tesco');
  });

  it('combines type, category, dates and search', async () => {
    const { user } = renderRoute('/transactions?month=all', { repository: seeded() });

    await user.click(screen.getByRole('radio', { name: 'Expenses' }));
    expect(shownDescriptions()).not.toContain('Salary');

    await user.type(screen.getByLabelText('From'), '2026-10-01');
    await user.type(screen.getByLabelText('To'), '2026-11-02');
    expect(shownDescriptions()).toEqual(['Rent', 'Tesco meal deal']);

    await user.type(screen.getByLabelText('Search transactions'), 'tesco');
    expect(shownDescriptions()).toEqual(['Tesco meal deal']);
    // Type and search sit outside the panel; only the custom dates count on its button.
    expect(screen.getByRole('button', { name: 'Filters (1)' })).toBeInTheDocument();
    expect(screen.getByText(/^Filtered by/)).toHaveTextContent(
      'Filtered by custom dates · Expenses · matching “tesco”',
    );
  });

  it('only offers categories of the chosen type and clears one that no longer fits', async () => {
    const { user } = renderRoute('/transactions?month=all', { repository: seeded() });
    const category = screen.getByLabelText<HTMLSelectElement>('Category');

    await user.selectOptions(category, 'transport');
    expect(shownDescriptions()).toEqual(['Train to Leeds']);

    await user.click(screen.getByRole('radio', { name: 'Income' }));

    expect(category.value).toBe('');
    expect(within(category).queryByRole('option', { name: 'Transport' })).not.toBeInTheDocument();
    expect(shownDescriptions()).toEqual(['Salary']);
  });

  it('explains an impossible date range and ignores it', async () => {
    const { user } = renderRoute('/transactions?month=all', { repository: seeded() });

    await user.type(screen.getByLabelText('From'), '2026-12-01');
    await user.type(screen.getByLabelText('To'), '2026-01-01');

    expect(screen.getByLabelText('To')).toHaveAccessibleDescription(
      'The start date is after the end date',
    );
    expect(shownDescriptions()).toHaveLength(5);
  });

  it.each([
    ['Oldest first', ['Train to Leeds', 'Tesco meal deal', 'Salary', 'Rent', 'TESCO Express']],
    [
      'Amount: high to low',
      ['Salary', 'Rent', 'Train to Leeds', 'TESCO Express', 'Tesco meal deal'],
    ],
    [
      'Amount: low to high',
      ['Tesco meal deal', 'TESCO Express', 'Train to Leeds', 'Rent', 'Salary'],
    ],
  ])('sorts by %s', async (label, expected) => {
    const { user } = renderRoute('/transactions?month=all', { repository: seeded() });

    await user.selectOptions(screen.getByLabelText('Sort by'), label);

    expect(shownDescriptions()).toEqual(expected);
  });

  it('summarises exactly what is shown: income, expenses, net and count', async () => {
    const { user } = renderRoute('/transactions?month=all', { repository: seeded() });
    const summary = () => screen.getByRole('region', { name: /^Summary for All time/ });

    // £12.50 + £950 + £3.95 + £45.99 out; the £2,850 salary in.
    expect(summary()).toHaveTextContent('Income£2,850.00');
    expect(summary()).toHaveTextContent('Expenses£1,012.44');
    expect(summary()).toHaveTextContent('Net cash flow+£1,837.56');
    expect(summary()).toHaveTextContent('Transactions5');

    await user.type(screen.getByRole('searchbox', { name: 'Search transactions' }), 'tesco');

    // Narrowed, it is no longer the period's cash flow, so it says what it is.
    expect(
      screen.getByRole('region', { name: 'Summary for All time · matching “tesco”' }),
    ).toHaveTextContent('Net of listed−£16.45');
    expect(summary()).not.toHaveTextContent('Net cash flow');
    expect(summary()).toHaveTextContent('Transactions2');

    await user.click(screen.getByRole('radio', { name: 'Expenses' }));
    expect(summary()).toHaveTextContent('Total spent£16.45');
  });

  it('shows a plain list with each row dated when sorted by amount', async () => {
    const { user } = renderRoute('/transactions?month=all', { repository: seeded() });
    expect(screen.getAllByRole('rowheader').length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'amount-desc');

    expect(screen.queryAllByRole('rowheader')).toHaveLength(0);
    const [first] = screen.getAllByRole('row').filter((row) => row.querySelector('td'));
    expect(first).toHaveTextContent('Salary');
    expect(first).toHaveTextContent('28 Oct 2026');
  });

  it('restores filters from the URL and ignores invalid values', () => {
    renderRoute(
      '/transactions?month=all&type=income&category=yachts&sort=amount-asc&from=2026-02-30',
      {
        repository: seeded(),
      },
    );

    expect(screen.getByRole('radio', { name: 'Income' })).toBeChecked();
    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.getByLabelText('From')).toHaveValue('');
    expect(screen.getByLabelText('Sort by')).toHaveValue('amount-asc');
    expect(shownDescriptions()).toEqual(['Salary']);
  });

  it('shows a no-match state whose reset clears filters, keeps the sort and refocuses search', async () => {
    const { user, router } = renderRoute('/transactions?month=all&q=zzz&sort=amount-asc', {
      repository: seeded(),
    });
    expect(
      screen.getByRole('heading', { name: 'No transactions match these filters' }),
    ).toBeInTheDocument();

    const resets = screen.getAllByRole('button', { name: 'Reset filters' });
    await user.click(resets[resets.length - 1] ?? document.body);

    expect(router.state.location.search).toBe('?month=all&sort=amount-asc');
    expect(shownDescriptions()).toHaveLength(5);
    expect(screen.getByLabelText('Search transactions')).toHaveValue('');
    expect(screen.getByLabelText('Search transactions')).toHaveFocus();
  });

  it('toggles the filter panel on small screens with an accessible button', async () => {
    const { user } = renderRoute('/transactions?month=all', { repository: seeded() });
    const toggle = screen.getByRole('button', { name: 'Filters' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'transaction-filters');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps edit and delete working on a filtered list', async () => {
    const repository = seeded();
    const { user } = renderRoute('/transactions?month=all&q=tesco', { repository });

    await user.click(
      screen.getByRole('button', { name: 'Actions for Tesco meal deal, 15 Oct 2026' }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete transaction' }));

    expect(shownDescriptions()).toEqual(['TESCO Express']);
    expect(count()).toBe('Showing 1 of 4 transactions');

    // Editing a transaction so it no longer matches removes it from the view.
    await user.click(screen.getByRole('button', { name: 'Actions for TESCO Express, 3 Nov 2026' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    const form = within(screen.getByRole('dialog'));
    await user.clear(form.getByLabelText('Description'));
    await user.type(form.getByLabelText('Description'), 'Corner shop');
    await user.click(form.getByRole('button', { name: 'Save changes' }));

    expect(
      screen.getByRole('heading', { name: 'No transactions match these filters' }),
    ).toBeInTheDocument();
    expect(repository.load().data.transactions.map((t) => t.description)).toContain('Corner shop');
  });
});
