import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { Transaction } from '../../models/transaction';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

// renderRoute fixes "today" at 15 November 2026, so the default range is Jun – Nov 2026.

function income(amountPence: number, date: string): Transaction {
  return makeTransaction({ type: 'income', categoryId: 'salary', amountPence, date });
}
function expense(amountPence: number, date: string, categoryId = 'food_groceries'): Transaction {
  return makeTransaction({ type: 'expense', amountPence, date, categoryId });
}

function seeded(...transactions: Transaction[]) {
  return createMemoryRepository({ ...createEmptyAppData(), transactions });
}

function region(name: string) {
  return screen.getByRole('region', { name });
}

const data = [
  income(250000, '2026-10-01'),
  income(250000, '2026-11-01'),
  expense(100000, '2026-10-02', 'rent_housing'),
  expense(30000, '2026-10-12', 'food_groceries'),
  expense(100000, '2026-11-02', 'rent_housing'),
  expense(50000, '2026-11-12', 'travel'),
  expense(99999, '2026-05-31', 'shopping'), // before the range
];

describe('Analytics page', () => {
  it('explains what to do when there is no data', () => {
    renderRoute('/analytics');

    expect(screen.getByRole('heading', { name: 'Nothing to analyse yet' })).toBeInTheDocument();
  });

  it('states the range and summarises every chart in words', () => {
    renderRoute('/analytics', { repository: seeded(...data) });

    expect(screen.getByText('Showing', { exact: false, selector: 'p' })).toHaveTextContent(
      'Showing Jun – Nov 2026',
    );
    expect(region('Income vs expenses')).toHaveTextContent(
      'Jun – Nov 2026: £5,000.00 in and £2,800.00 out, leaving £2,200.00 more coming in.',
    );
    expect(region('Spending trend')).toHaveTextContent(
      'Highest spending: November 2026 (£1,500.00). Lowest: October 2026 (£1,300.00).',
    );
    expect(region('Spending breakdown')).toHaveTextContent(
      '£2,800.00 spent across 3 categories in Jun – Nov 2026. The largest was Rent & Housing at £2,000.00 (71.4%).',
    );
  });

  it('offers the exact figures as a table', async () => {
    const { user } = renderRoute('/analytics', { repository: seeded(...data) });
    const card = region('Income vs expenses');

    await user.click(within(card).getByText('Show data table'));

    const table = within(card).getByRole('table', { name: 'Income vs expenses by month' });
    const october = within(table).getByRole('row', { name: /October 2026/ });
    expect(october).toHaveTextContent('£2,500.00£1,300.00£1,200.00');
    // Every month in the range is listed, including those without data.
    expect(within(table).getAllByRole('row')).toHaveLength(7); // header + 6 months
  });

  it('ranks categories by spending, with amounts and shares as text', () => {
    renderRoute('/analytics', { repository: seeded(...data) });

    const items = within(region('Category analysis')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Rent & Housing£2,000.00 · 71.4%'),
      expect.stringContaining('Travel£500.00 · 17.9%'),
      expect.stringContaining('Food & Groceries£300.00 · 10.7%'),
    ]);
  });

  it('refuses to draw a trend from a single month', () => {
    renderRoute('/analytics', { repository: seeded(expense(1000, '2026-11-02')) });

    expect(region('Spending trend')).toHaveTextContent(
      'A trend needs spending in at least two months.',
    );
  });

  it('shows clear messages instead of empty charts when nothing was spent', () => {
    renderRoute('/analytics', { repository: seeded(income(1000, '2026-11-01')) });

    expect(region('Spending breakdown')).toHaveTextContent('No spending in Jun – Nov 2026.');
    expect(region('Category analysis')).toHaveTextContent('No spending in Jun – Nov 2026.');
  });

  it('switches range with the selector', async () => {
    const { user } = renderRoute('/analytics', { repository: seeded(...data) });

    await user.click(screen.getByRole('radio', { name: 'Last 12 months' }));

    expect(screen.getByText('Showing', { exact: false, selector: 'p' })).toHaveTextContent(
      'Showing Dec 2025 – Nov 2026',
    );
    // May's shopping is now in range.
    expect(region('Spending breakdown')).toHaveTextContent('across 4 categories');
  });
});

describe('Overview chart', () => {
  it('shows the cash flow chart over the last six months, with the savings goals section', () => {
    renderRoute('/', { repository: seeded(...data) });

    expect(region('Cash flow')).toHaveTextContent('Jun – Nov 2026');
    expect(region('Savings goals')).toHaveTextContent('No savings goals yet');
  });
});
