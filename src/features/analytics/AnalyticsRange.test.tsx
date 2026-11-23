import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { Transaction } from '../../models/transaction';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

// renderRoute fixes "today" at 15 November 2026 unless `now` is given.

function income(amountPence: number, date: string): Transaction {
  return makeTransaction({ type: 'income', categoryId: 'salary', amountPence, date });
}
function expense(amountPence: number, date: string): Transaction {
  return makeTransaction({ type: 'expense', categoryId: 'food_groceries', amountPence, date });
}

// One salary and one expense in each month from Dec 2025 to Nov 2026.
const yearOfData: Transaction[] = Array.from({ length: 12 }, (_, i) => {
  const month = i === 0 ? '2025-12' : `2026-${String(i).padStart(2, '0')}`;
  return [income(200000, `${month}-01`), expense(100000 + i * 100, `${month}-10`)];
}).flat();

function seeded(...transactions: Transaction[]) {
  return createMemoryRepository({ ...createEmptyAppData(), transactions });
}

function shownRange() {
  return screen.getByText('Showing', { exact: false, selector: 'p' }).textContent;
}

function card(name: string) {
  return screen.getByRole('region', { name });
}

describe('Analytics date range', () => {
  it('defaults to the last 6 months without a URL parameter', () => {
    const { router } = renderRoute('/analytics', { repository: seeded(...yearOfData) });

    expect(screen.getByRole('radio', { name: 'Last 6 months' })).toBeChecked();
    expect(shownRange()).toBe('Showing Jun – Nov 2026');
    expect(router.state.location.search).toBe('');
  });

  it.each([
    ['This month', '?range=this-month', 'Showing November 2026', '£2,000.00', '£1,011.00'],
    ['Last month', '?range=last-month', 'Showing October 2026', '£2,000.00', '£1,010.00'],
    ['Last 3 months', '?range=last-3', 'Showing Sep – Nov 2026', '£6,000.00', '£3,030.00'],
    ['Last 12 months', '?range=last-12', 'Showing Dec 2025 – Nov 2026', '£24,000.00', '£12,066.00'],
  ])('%s covers the right calendar months', async (label, search, shown, income, spent) => {
    const { user, router } = renderRoute('/analytics', { repository: seeded(...yearOfData) });

    await user.click(screen.getByRole('radio', { name: label }));

    expect(router.state.location.search).toBe(search);
    expect(shownRange()).toBe(shown);
    expect(card('Income')).toHaveTextContent(income);
    expect(card('Expenses')).toHaveTextContent(spent);
  });

  it('keeps the range totals equal to the sum of the months in the table', async () => {
    const { user } = renderRoute('/analytics?range=last-3', {
      repository: seeded(...yearOfData),
    });
    const incomeExpense = card('Income vs expenses');

    await user.click(within(incomeExpense).getByText('Show data table'));

    const rows = within(within(incomeExpense).getByRole('table')).getAllByRole('row').slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      'September 2026£2,000.00£1,009.00£991.00',
      'October 2026£2,000.00£1,010.00£990.00',
      'November 2026£2,000.00£1,011.00£989.00',
    ]);
    expect(card('Expenses')).toHaveTextContent('£3,030.00'); // 1,009 + 1,010 + 1,011
    expect(card('Average monthly spend')).toHaveTextContent('£1,010.00');
  });

  it('restores the range from the URL, e.g. after a refresh or a shared link', () => {
    renderRoute('/analytics?range=last-12', { repository: seeded(...yearOfData) });

    expect(screen.getByRole('radio', { name: 'Last 12 months' })).toBeChecked();
    expect(shownRange()).toBe('Showing Dec 2025 – Nov 2026');
  });

  it('falls back to the default for an unknown range', () => {
    renderRoute('/analytics?range=last-99', { repository: seeded(...yearOfData) });

    expect(screen.getByRole('radio', { name: 'Last 6 months' })).toBeChecked();
  });

  it('works with the browser Back button', async () => {
    const { user, router } = renderRoute('/analytics', { repository: seeded(...yearOfData) });

    await user.click(screen.getByRole('radio', { name: 'Last 3 months' }));
    await user.click(screen.getByRole('radio', { name: 'Last 12 months' }));
    await act(() => router.navigate(-1));

    expect(screen.getByRole('radio', { name: 'Last 3 months' })).toBeChecked();
    expect(shownRange()).toBe('Showing Sep – Nov 2026');
  });

  it('measures "last month" from today, across a year boundary', () => {
    renderRoute('/analytics?range=last-month', {
      repository: seeded(...yearOfData),
      now: new Date(2027, 0, 10, 12, 0),
    });

    expect(shownRange()).toBe('Showing December 2026');
  });

  it('explains that one month cannot show a trend', async () => {
    const { user } = renderRoute('/analytics', { repository: seeded(...yearOfData) });

    await user.click(screen.getByRole('radio', { name: 'This month' }));

    expect(card('Spending trend')).toHaveTextContent(
      'Choose a range of two months or more to see a trend.',
    );
    expect(card('Average monthly spend')).toHaveTextContent('This period is a single month');
  });

  it('averages only over months since records began', async () => {
    const { user } = renderRoute('/analytics', {
      repository: seeded(expense(30000, '2026-10-05'), expense(10000, '2026-11-05')),
    });

    await user.click(screen.getByRole('radio', { name: 'Last 12 months' }));

    // Two tracked months (Oct, Nov), not twelve.
    expect(card('Average monthly spend')).toHaveTextContent('£200.00');
    expect(card('Average monthly spend')).toHaveTextContent('Across 2 months with records');
  });

  it('replaces the month picker on Analytics', () => {
    renderRoute('/analytics', { repository: seeded(...yearOfData) });

    expect(screen.queryByRole('group', { name: 'Reporting month' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Date range' })).toBeInTheDocument();
  });
});
