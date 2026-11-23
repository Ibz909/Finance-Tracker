import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import { createLocalStorageRepository } from '../../services/storage/localStorageRepository';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

interface FormInput {
  type?: 'Income' | 'Expense';
  amount?: string;
  /** Category ID (option value), e.g. 'rent_housing'. */
  categoryId?: string;
  description?: string;
  date?: string;
}

function dialog() {
  return screen.getByRole('dialog');
}

async function fillTransactionForm(user: UserEvent, input: FormInput) {
  const form = within(dialog());
  if (input.type) await user.click(form.getByRole('radio', { name: input.type }));
  if (input.amount !== undefined) {
    await user.clear(form.getByLabelText('Amount'));
    await user.type(form.getByLabelText('Amount'), input.amount);
  }
  if (input.categoryId) {
    await user.selectOptions(form.getByLabelText('Category'), input.categoryId);
  }
  if (input.description !== undefined) {
    await user.clear(form.getByLabelText('Description'));
    await user.type(form.getByLabelText('Description'), input.description);
  }
  if (input.date) {
    await user.clear(form.getByLabelText('Date'));
    await user.type(form.getByLabelText('Date'), input.date);
  }
}

function seeded(...transactions: Parameters<typeof makeTransaction>[0][]) {
  return createMemoryRepository({
    ...createEmptyAppData(),
    transactions: transactions.map((t) => makeTransaction(t)),
  });
}

function rows() {
  const region = screen.getByRole('region', { name: 'All transactions' });
  return within(region).getAllByRole('listitem');
}

describe('Transactions page', () => {
  it('shows a helpful empty state', () => {
    renderRoute('/transactions');

    expect(screen.getByRole('heading', { name: 'No transactions yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add your first transaction' })).toBeInTheDocument();
  });

  it('lists transactions newest first with type in words and signed amounts', () => {
    renderRoute('/transactions', {
      repository: seeded(
        { description: 'Older shop', date: '2026-11-01', amountPence: 1250 },
        {
          description: 'Salary',
          date: '2026-11-20',
          type: 'income',
          categoryId: 'salary',
          amountPence: 285000,
        },
      ),
    });

    const [first, second] = rows();
    expect(first).toHaveTextContent('Salary');
    expect(first).toHaveTextContent('Income');
    expect(first).toHaveTextContent('+£2,850.00');
    expect(first).toHaveTextContent('20 Nov 2026');
    expect(second).toHaveTextContent('Older shop');
    expect(second).toHaveTextContent('Food & Groceries');
    expect(second).toHaveTextContent('−£12.50');
    expect(screen.getByText('2 transactions')).toBeInTheDocument();
  });

  it('labels demo records', () => {
    renderRoute('/transactions', { repository: seeded({ description: 'Sample', isDemo: true }) });

    expect(screen.getByText('Demo').closest('li')).toHaveTextContent('Sample');
  });
});

describe('Adding a transaction', () => {
  it('adds a transaction from the top bar and saves it', async () => {
    const { user, repository } = renderRoute('/transactions');

    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    expect(dialog()).toHaveAccessibleName('Add transaction');
    expect(within(dialog()).getByLabelText('Amount')).toHaveFocus();

    await fillTransactionForm(user, {
      amount: '£1,045.50',
      categoryId: 'rent_housing',
      description: 'December rent',
      date: '2026-12-01',
    });
    await user.click(within(dialog()).getByRole('button', { name: 'Add transaction' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rows()[0]).toHaveTextContent('December rent');
    expect(rows()[0]).toHaveTextContent('−£1,045.50');
    expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent(
      'Transaction added',
    );
    expect(repository.load().data.transactions).toEqual([
      expect.objectContaining({
        amountPence: 104550,
        categoryId: 'rent_housing',
        date: '2026-12-01',
        description: 'December rent',
        isDemo: false,
        type: 'expense',
      }),
    ]);
  });

  it('can be started from the empty state', async () => {
    const { user } = renderRoute('/transactions');

    await user.click(screen.getByRole('button', { name: 'Add your first transaction' }));

    expect(dialog()).toHaveAccessibleName('Add transaction');
  });

  it('shows linked, accessible errors and saves nothing when input is invalid', async () => {
    const { user, repository } = renderRoute('/transactions');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    await fillTransactionForm(user, { amount: '12.345' });

    await user.click(within(dialog()).getByRole('button', { name: 'Add transaction' }));

    const form = within(dialog());
    const amount = form.getByLabelText('Amount');
    expect(amount).toHaveFocus();
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(amount).toHaveAccessibleDescription('Use no more than two decimal places');
    expect(form.getByLabelText('Category')).toHaveAccessibleDescription('Choose a category');
    expect(form.getByLabelText('Description')).toHaveAccessibleDescription('Enter a description');
    expect(repository.load().data.transactions).toEqual([]);
  });

  it('offers only matching categories and clears one that no longer fits', async () => {
    const { user } = renderRoute('/transactions');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    const category = within(dialog()).getByLabelText<HTMLSelectElement>('Category');

    await fillTransactionForm(user, { categoryId: 'transport' });
    await fillTransactionForm(user, { type: 'Income' });

    expect(category.value).toBe('');
    expect(within(category).getByRole('option', { name: 'Salary' })).toBeInTheDocument();
    expect(within(category).queryByRole('option', { name: 'Transport' })).not.toBeInTheDocument();
  });

  it('closes without saving on Cancel or Escape', async () => {
    const { user, repository } = renderRoute('/transactions');
    const addButton = screen.getByRole('button', { name: 'Add transaction' });

    await user.click(addButton);
    await fillTransactionForm(user, { amount: '5', description: 'Not saved' });
    await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(addButton);
    expect(within(dialog()).getByLabelText('Amount')).toHaveValue(''); // starts fresh
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(repository.load().data.transactions).toEqual([]);
  });

  it('keeps added transactions after a refresh', async () => {
    const first = renderRoute('/transactions', { repository: createLocalStorageRepository() });
    await first.user.click(screen.getByRole('button', { name: 'Add transaction' }));
    await fillTransactionForm(first.user, {
      amount: '3.20',
      categoryId: 'restaurants_takeaways',
      description: 'Coffee',
    });
    await first.user.click(within(dialog()).getByRole('button', { name: 'Add transaction' }));
    first.unmount();

    renderRoute('/transactions', { repository: createLocalStorageRepository() });

    expect(rows()[0]).toHaveTextContent('Coffee');
    expect(rows()[0]).toHaveTextContent('−£3.20');
  });
});

describe('Editing a transaction', () => {
  it('pre-fills the form and saves changes, keeping when it was created', async () => {
    const repository = seeded({
      id: 'txn-edit',
      description: 'Groceries',
      amountPence: 4599,
      notes: 'Big shop',
    });
    const { user } = renderRoute('/transactions', { repository });

    await user.click(screen.getByRole('button', { name: 'Edit Groceries' }));

    const form = within(dialog());
    expect(dialog()).toHaveAccessibleName('Edit transaction');
    expect(form.getByLabelText('Amount')).toHaveValue('45.99');
    expect(form.getByLabelText('Description')).toHaveValue('Groceries');
    expect(form.getByLabelText(/Notes/)).toHaveValue('Big shop');

    await fillTransactionForm(user, { amount: '50', description: 'Groceries and wine' });
    await user.clear(form.getByLabelText(/Notes/));
    await user.click(form.getByRole('button', { name: 'Save changes' }));

    expect(rows()[0]).toHaveTextContent('Groceries and wine');
    expect(rows()[0]).toHaveTextContent('−£50.00');
    const [saved] = repository.load().data.transactions;
    expect(saved).toMatchObject({
      id: 'txn-edit',
      amountPence: 5000,
      createdAt: '2026-03-15T12:00:00.000Z',
    });
    expect(saved).not.toHaveProperty('notes');
    expect(saved?.updatedAt).not.toBe(saved?.createdAt);
  });
});

describe('Deleting a transaction', () => {
  it('asks for confirmation, and Cancel keeps the transaction', async () => {
    const { user, repository } = renderRoute('/transactions', {
      repository: seeded({ description: 'Gym', amountPence: 3500, date: '2026-11-05' }),
    });

    await user.click(screen.getByRole('button', { name: 'Delete Gym' }));

    const confirm = screen.getByRole('dialog', { name: 'Delete “Gym”?' });
    expect(confirm).toHaveAccessibleDescription(
      '£35.00 expense on 5 Nov 2026. This can’t be undone.',
    );
    expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));

    expect(rows()).toHaveLength(1);
    expect(repository.load().data.transactions).toHaveLength(1);
  });

  it('removes the transaction once confirmed', async () => {
    const { user, repository } = renderRoute('/transactions', {
      repository: seeded({ description: 'Gym' }, { description: 'Bus' }),
    });

    await user.click(screen.getByRole('button', { name: 'Delete Gym' }));
    await user.click(screen.getByRole('button', { name: 'Delete transaction' }));

    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    expect(rows()).toHaveLength(1);
    expect(repository.load().data.transactions.map((t) => t.description)).toEqual(['Bus']);
    expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent(
      'Transaction deleted',
    );
  });
});
