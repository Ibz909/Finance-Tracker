import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { Transaction } from '../../models/transaction';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

// renderRoute fixes "today" at Sunday 15 November 2026.

function spend(description: string, date: string, amountPence: number): Transaction {
  return makeTransaction({ description, date, amountPence, type: 'expense' });
}

const data: Transaction[] = [
  spend('Coffee', '2026-11-15', 350),
  makeTransaction({
    description: 'Salary',
    date: '2026-11-14',
    amountPence: 250000,
    type: 'income',
    categoryId: 'salary',
  }),
  spend('Lunch', '2026-11-14', 1200),
  spend('Halloween party', '2026-10-31', 2000),
  spend('New Year’s Eve', '2025-12-31', 5000),
  spend('New year gym', '2026-01-01', 3000),
];

function seeded() {
  return createMemoryRepository({ ...createEmptyAppData(), transactions: data });
}

function shown() {
  return screen
    .queryAllByRole('row')
    .filter((row) => row.querySelector('td'))
    .map((row) => row.querySelector('td p')?.textContent);
}

function month(name: string) {
  return screen.getByRole('radio', { name });
}

describe('Month navigation', () => {
  it('opens on the current month', () => {
    renderRoute('/transactions', { repository: seeded() });

    expect(screen.getByRole('heading', { level: 2, name: 'November 2026' })).toBeInTheDocument();
    expect(month('November 2026')).toBeChecked();
    expect(shown()).toEqual(['Coffee', 'Salary', 'Lunch']);
    expect(screen.getByRole('region', { name: 'Summary for November 2026' })).toHaveTextContent(
      'Transactions3',
    );
  });

  it('labels Today and Yesterday, with each day’s net total', () => {
    renderRoute('/transactions', { repository: seeded() });

    const todayHeading = screen.getByRole('rowheader', { name: /^Today, Sunday 15 November 2026/ });
    expect(todayHeading).toHaveTextContent('Day total −£3.50');
    // £2,500 salary in, £12 lunch out.
    expect(
      screen.getByRole('rowheader', { name: /^Yesterday, Saturday 14 November 2026/ }),
    ).toHaveTextContent('Day total +£2,488.00');
  });

  it('switches month without a reload, and Overview follows', async () => {
    const { user, router } = renderRoute('/transactions', { repository: seeded() });

    await user.click(month('October 2026'));

    expect(shown()).toEqual(['Halloween party']);
    expect(router.state.location.search).toBe('?month=2026-10');

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    await user.click(within(nav).getByRole('link', { name: 'Overview' }));
    expect(screen.getByRole('region', { name: 'Net cash flow, October 2026' })).toBeInTheDocument();
  });

  it('opens on the month Overview is showing', async () => {
    const { user } = renderRoute('/', { repository: seeded() });

    await user.click(screen.getByRole('button', { name: 'Previous month, October 2026' }));
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    await user.click(within(nav).getByRole('link', { name: 'Transactions' }));

    expect(month('October 2026')).toBeChecked();
    expect(shown()).toEqual(['Halloween party']);
  });

  it('moves between years, from December into January', async () => {
    const { user } = renderRoute('/transactions', { repository: seeded() });

    await user.click(screen.getByRole('button', { name: 'Show 2025' }));
    await user.click(month('December 2025'));
    expect(shown()).toEqual(['New Year’s Eve']);

    await user.click(screen.getByRole('button', { name: 'Show 2026' }));
    await user.click(month('January 2026'));
    expect(shown()).toEqual(['New year gym']);
  });

  it('shows All time, and explains an empty month with a way out', async () => {
    const { user } = renderRoute('/transactions?month=2026-02', { repository: seeded() });

    expect(screen.getByRole('heading', { name: 'No transactions in February 2026' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show all time' }));

    expect(screen.getByRole('radio', { name: 'All time' })).toBeChecked();
    expect(shown()).toHaveLength(6);
  });

  it('lets a custom date range replace the month, and a month replace the range', async () => {
    const { user } = renderRoute('/transactions', { repository: seeded() });

    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    await user.type(screen.getByLabelText('From'), '2026-10-01');
    await user.type(screen.getByLabelText('To'), '2026-11-14');

    expect(
      screen.getByRole('heading', { level: 2, name: '1 Oct 2026 – 14 Nov 2026' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio').filter((r) => (r as HTMLInputElement).checked)).toEqual([
      screen.getByRole('radio', { name: 'All' }),
    ]);
    expect(shown()).toEqual(['Salary', 'Lunch', 'Halloween party']);

    await user.click(month('November 2026'));
    expect(screen.getByLabelText('From')).toHaveValue('');
    expect(screen.getByLabelText('To')).toHaveValue('');
    expect(shown()).toEqual(['Coffee', 'Salary', 'Lunch']);
  });

  it('keeps the month when filters are reset', async () => {
    const { user } = renderRoute('/transactions', { repository: seeded() });

    await user.type(screen.getByRole('searchbox', { name: 'Search transactions' }), 'coffee');
    await user.click(screen.getByRole('radio', { name: 'Expenses' }));
    expect(shown()).toEqual(['Coffee']);

    await user.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(month('November 2026')).toBeChecked();
    expect(shown()).toEqual(['Coffee', 'Salary', 'Lunch']);
  });
});
