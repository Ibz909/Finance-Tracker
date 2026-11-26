import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { Transaction } from '../../models/transaction';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeBudget, makeGoal, makeSchedule, makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

// renderRoute fixes "today" at 15 November 2026.

function income(amountPence: number, date: string, description = 'Salary') {
  return makeTransaction({ type: 'income', categoryId: 'salary', amountPence, date, description });
}
function expense(amountPence: number, date: string, description = 'Shopping') {
  return makeTransaction({
    type: 'expense',
    categoryId: 'shopping',
    amountPence,
    date,
    description,
  });
}

function seeded(...transactions: Transaction[]) {
  return createMemoryRepository({ ...createEmptyAppData(), transactions });
}

function region(name: string | RegExp) {
  return screen.getByRole('region', { name });
}

/** The net cash flow figure and its sentence. */
function hero() {
  return region(/^Net cash flow/);
}

/** A supporting figure (income, expenses, savings rate) with its label. */
function metric(label: string): HTMLElement {
  const term = screen.getByText(label, { selector: 'dt' });
  if (!term.parentElement) throw new Error(`No figure for ${label}`);
  return term.parentElement;
}

/** Body rows of the recent activity table. */
function recentRows() {
  return within(region('Recent activity')).queryAllByRole('row').slice(1);
}

const sample = [
  income(250000, '2026-11-01', 'November salary'),
  expense(95000, '2026-11-02', 'Rent'),
  expense(4500, '2026-11-14', 'Groceries'),
  income(240000, '2026-10-28', 'October salary'),
  expense(300000, '2026-10-12', 'Holiday'),
];

describe('Dashboard', () => {
  it('welcomes a new user and offers to add a first transaction', async () => {
    const { user } = renderRoute('/');

    expect(screen.getByRole('heading', { name: 'Welcome to PencePlot' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add your first transaction' }));
    expect(screen.getByRole('dialog', { name: 'Add transaction' })).toBeInTheDocument();
  });

  it.each([
    ['a savings goal', { savingsGoals: [makeGoal({ name: 'Holiday' })] }, 'Savings goals'],
    ['a budget', { budgets: [makeBudget()] }, 'Monthly budget'],
    [
      'a recurring transaction not yet due',
      { recurringSchedules: [makeSchedule({ nextDueDate: '2026-12-01' })] },
      'Recent activity',
    ],
  ])('shows the overview, not the welcome, with only %s', (_label, data, section) => {
    renderRoute('/', { repository: createMemoryRepository({ ...createEmptyAppData(), ...data }) });

    expect(screen.queryByRole('heading', { name: 'Welcome to PencePlot' })).not.toBeInTheDocument();
    expect(region(section)).toBeVisible();
    expect(region('Recent activity')).toHaveTextContent('No transactions in November 2026.');
  });

  it('summarises the current month from stored transactions', () => {
    renderRoute('/', { repository: seeded(...sample) });

    expect(region('Net cash flow this month')).toHaveTextContent('+£1,505.00');
    expect(hero()).toHaveTextContent('You’ve spent less than you’ve earned this month.');
    expect(metric('Income')).toHaveTextContent('£2,500.00');
    expect(metric('Expenses')).toHaveTextContent('£995.00');
    expect(metric('Savings rate')).toHaveTextContent('60.2%'); // 150500 / 250000
    expect(metric('Savings rate')).toHaveTextContent('Estimate from cash flow');
  });

  it('lists the month’s recent transactions, newest first, and nothing from other months', () => {
    renderRoute('/', { repository: seeded(...sample) });

    expect(
      recentRows().map((row) => within(row).getByText(/salary|Rent|Groceries/).textContent),
    ).toEqual(['Groceries', 'Rent', 'November salary']);
    expect(recentRows()[0]).toHaveTextContent('−£45.00 expense');
    expect(recentRows()[2]).toHaveTextContent('+£2,500.00 income');
  });

  it('shows at most five recent transactions', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      expense(100, `2026-11-0${String(i + 1)}`, `Item ${String(i + 1)}`),
    );
    renderRoute('/', { repository: seeded(...many) });

    expect(recentRows()).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'All transactions' })).toHaveAttribute(
      'href',
      '/transactions',
    );
  });

  it('explains a deficit and a negative savings rate', () => {
    renderRoute('/', {
      repository: seeded(income(100000, '2026-11-01'), expense(125000, '2026-11-03')),
    });

    expect(hero()).toHaveTextContent('−£250.00');
    expect(hero()).toHaveTextContent('You’ve spent more than you’ve earned this month.');
    expect(metric('Savings rate')).toHaveTextContent('−25.0%');
  });

  it('shows a dash, not NaN or Infinity, when there is no income', () => {
    renderRoute('/', { repository: seeded(expense(5000, '2026-11-03')) });

    const rate = metric('Savings rate');
    expect(rate).toHaveTextContent('—');
    expect(rate).toHaveTextContent('No income, so no rate to show');
    expect(rate).not.toHaveTextContent(/NaN|Infinity/);
  });

  it('updates immediately when a transaction is added', async () => {
    const { user } = renderRoute('/', { repository: seeded(...sample) });

    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    const form = within(screen.getByRole('dialog'));
    await user.type(form.getByLabelText('Amount'), '5');
    await user.selectOptions(form.getByLabelText('Category'), 'transport');
    await user.type(form.getByLabelText('Description'), 'Bus');
    await user.clear(form.getByLabelText('Date'));
    await user.type(form.getByLabelText('Date'), '2026-11-15');
    await user.click(form.getByRole('button', { name: 'Add transaction' }));

    expect(metric('Expenses')).toHaveTextContent('£1,000.00');
    expect(recentRows()[0]).toHaveTextContent('Bus');
  });

  it('updates immediately when a transaction is deleted', async () => {
    const { user } = renderRoute('/', { repository: seeded(...sample) });

    await user.click(screen.getByRole('button', { name: 'Actions for Rent, 2 Nov 2026' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete transaction' }));

    expect(metric('Expenses')).toHaveTextContent('£45.00');
  });

  it('edits a transaction from its row menu', async () => {
    const { user } = renderRoute('/', { repository: seeded(...sample) });

    await user.click(screen.getByRole('button', { name: 'Actions for Rent, 2 Nov 2026' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(screen.getByRole('dialog', { name: 'Edit transaction' })).toBeInTheDocument();
  });

  it('charts cash flow from real history, over a range the user picks', async () => {
    const { user } = renderRoute('/', { repository: seeded(...sample) });
    const chart = region('Cash flow');
    const monthRows = () => within(chart).getAllByRole('row', { hidden: true }).slice(1);

    expect(within(chart).getByRole('radio', { name: '6 months' })).toBeChecked();
    expect(monthRows()).toHaveLength(6);
    expect(chart).toHaveTextContent('£4,900.00 in and £3,995.00 out');

    await user.click(within(chart).getByRole('radio', { name: '3 months' }));

    expect(monthRows()).toHaveLength(3);
    expect(monthRows().at(-1)).toHaveTextContent('November 2026');
  });

  it('no longer repeats the Analytics spending charts', () => {
    renderRoute('/', { repository: seeded(...sample) });

    expect(screen.queryByRole('region', { name: 'Spending over time' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Spending by category' })).not.toBeInTheDocument();
  });
});

describe('Reporting month', () => {
  it('switches every figure to the chosen month and back', async () => {
    const { user } = renderRoute('/', { repository: seeded(...sample) });
    const picker = screen.getByRole('group', { name: 'Reporting month' });
    expect(picker).toHaveTextContent('November 2026');
    expect(within(picker).queryByRole('button', { name: 'This month' })).not.toBeInTheDocument();

    await user.click(within(picker).getByRole('button', { name: 'Previous month, October 2026' }));

    expect(picker).toHaveTextContent('October 2026');
    expect(metric('Income')).toHaveTextContent('£2,400.00');
    expect(metric('Expenses')).toHaveTextContent('£3,000.00');
    expect(region('Net cash flow, October 2026')).toHaveTextContent('−£600.00');
    expect(recentRows().map((row) => row.textContent)).toEqual([
      expect.stringContaining('October salary'),
      expect.stringContaining('Holiday'),
    ]);

    await user.click(within(picker).getByRole('button', { name: 'This month' }));

    expect(picker).toHaveTextContent('November 2026');
    expect(metric('Income')).toHaveTextContent('£2,500.00');
  });

  it('shows zeros and an add shortcut for a month with no transactions', async () => {
    const { user } = renderRoute('/', { repository: seeded(...sample) });

    await user.click(screen.getByRole('button', { name: 'Next month, December 2026' }));

    expect(metric('Income')).toHaveTextContent('£0.00');
    expect(hero()).toHaveTextContent('Nothing recorded in December 2026 yet.');
    expect(screen.getByText('No transactions in December 2026.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a transaction' })).toBeInTheDocument();
  });

  it('crosses year boundaries', async () => {
    const { user } = renderRoute('/', { repository: seeded(...sample) });

    await user.click(screen.getByRole('button', { name: 'Next month, December 2026' }));
    await user.click(screen.getByRole('button', { name: 'Next month, January 2027' }));

    expect(screen.getByRole('group', { name: 'Reporting month' })).toHaveTextContent(
      'January 2027',
    );
  });

  it('only appears on pages that use it', () => {
    renderRoute('/transactions', { repository: seeded(...sample) });

    expect(screen.queryByRole('group', { name: 'Reporting month' })).not.toBeInTheDocument();
  });
});
