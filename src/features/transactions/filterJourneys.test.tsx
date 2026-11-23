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
  const region = screen.getByRole('region', { name: 'All transactions' });
  return within(region)
    .queryAllByRole('listitem')
    .map((item) => item.querySelector('p span')?.textContent);
}

function count() {
  return screen.getByText(/transactions?$/, { selector: 'p' }).textContent;
}

describe('Transaction search and filters', () => {
  it('shows everything, newest first, with a plain count by default', () => {
    renderRoute('/transactions', { repository: seeded() });

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
    const { user, router } = renderRoute('/transactions', { repository: seeded() });

    await user.type(screen.getByLabelText('Search transactions'), '  tesco');

    expect(shownDescriptions()).toEqual(['TESCO Express', 'Tesco meal deal']);
    expect(count()).toBe('Showing 2 of 5 transactions');
    expect(router.state.location.search).toBe('?q=++tesco');
  });

  it('combines type, category, dates and search', async () => {
    const { user } = renderRoute('/transactions', { repository: seeded() });

    await user.selectOptions(screen.getByLabelText('Type'), 'expense');
    expect(shownDescriptions()).not.toContain('Salary');

    await user.type(screen.getByLabelText('From'), '2026-10-01');
    await user.type(screen.getByLabelText('To'), '2026-11-02');
    expect(shownDescriptions()).toEqual(['Rent', 'Tesco meal deal']);

    await user.type(screen.getByLabelText('Search transactions'), 'tesco');
    expect(shownDescriptions()).toEqual(['Tesco meal deal']);
    expect(screen.getByRole('button', { name: 'Filters (4)' })).toBeInTheDocument();
  });

  it('only offers categories of the chosen type and clears one that no longer fits', async () => {
    const { user } = renderRoute('/transactions', { repository: seeded() });
    const category = screen.getByLabelText<HTMLSelectElement>('Category');

    await user.selectOptions(category, 'transport');
    expect(shownDescriptions()).toEqual(['Train to Leeds']);

    await user.selectOptions(screen.getByLabelText('Type'), 'income');

    expect(category.value).toBe('');
    expect(within(category).queryByRole('option', { name: 'Transport' })).not.toBeInTheDocument();
    expect(shownDescriptions()).toEqual(['Salary']);
  });

  it('explains an impossible date range and ignores it', async () => {
    const { user } = renderRoute('/transactions', { repository: seeded() });

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
    const { user } = renderRoute('/transactions', { repository: seeded() });

    await user.selectOptions(screen.getByLabelText('Sort by'), label);

    expect(shownDescriptions()).toEqual(expected);
  });

  it('restores filters from the URL and ignores invalid values', () => {
    renderRoute('/transactions?type=income&category=yachts&sort=amount-asc&from=2026-02-30', {
      repository: seeded(),
    });

    expect(screen.getByLabelText('Type')).toHaveValue('income');
    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.getByLabelText('From')).toHaveValue('');
    expect(screen.getByLabelText('Sort by')).toHaveValue('amount-asc');
    expect(shownDescriptions()).toEqual(['Salary']);
  });

  it('shows a no-match state whose reset clears filters, keeps the sort and refocuses search', async () => {
    const { user, router } = renderRoute('/transactions?q=zzz&sort=amount-asc', {
      repository: seeded(),
    });
    expect(
      screen.getByRole('heading', { name: 'No transactions match these filters' }),
    ).toBeInTheDocument();

    const resets = screen.getAllByRole('button', { name: 'Reset filters' });
    await user.click(resets[resets.length - 1] ?? document.body);

    expect(router.state.location.search).toBe('?sort=amount-asc');
    expect(shownDescriptions()).toHaveLength(5);
    expect(screen.getByLabelText('Search transactions')).toHaveValue('');
    expect(screen.getByLabelText('Search transactions')).toHaveFocus();
  });

  it('toggles the filter panel on small screens with an accessible button', async () => {
    const { user } = renderRoute('/transactions', { repository: seeded() });
    const toggle = screen.getByRole('button', { name: 'Filters' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'transaction-filters');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps edit and delete working on a filtered list', async () => {
    const repository = seeded();
    const { user } = renderRoute('/transactions?q=tesco', { repository });

    await user.click(screen.getByRole('button', { name: 'Delete Tesco meal deal' }));
    await user.click(screen.getByRole('button', { name: 'Delete transaction' }));

    expect(shownDescriptions()).toEqual(['TESCO Express']);
    expect(count()).toBe('Showing 1 of 4 transactions');

    // Editing a transaction so it no longer matches removes it from the view.
    await user.click(screen.getByRole('button', { name: 'Edit TESCO Express' }));
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
