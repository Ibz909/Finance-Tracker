import type { Budget } from '../models/budget';
import type { RecurringSchedule } from '../models/recurring';
import type { Transaction } from '../models/transaction';

let counter = 0;

/**
 * Builds a valid transaction with fixed, deterministic values. Override
 * only what a test cares about. IDs are sequential so they never collide.
 */
export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  counter += 1;
  return {
    id: `txn-${String(counter)}`,
    type: 'expense',
    amountPence: 1250,
    categoryId: 'food_groceries',
    description: 'Weekly shop',
    date: '2026-03-15',
    createdAt: '2026-03-15T12:00:00.000Z',
    updatedAt: '2026-03-15T12:00:00.000Z',
    isDemo: false,
    ...overrides,
  };
}

/** A valid budget; defaults to a £300 groceries limit. */
export function makeBudget(overrides: Partial<Budget> = {}): Budget {
  counter += 1;
  const budget: Budget = {
    id: `budget-${String(counter)}`,
    scope: 'category',
    categoryId: 'food_groceries',
    limitPence: 30000,
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
    isDemo: false,
    ...overrides,
  };
  // An overall budget must not carry a category.
  if (budget.scope === 'overall' && !('categoryId' in overrides)) delete budget.categoryId;
  return budget;
}

/** A valid recurring schedule; defaults to £950 rent on the 1st of each month. */
export function makeSchedule(overrides: Partial<RecurringSchedule> = {}): RecurringSchedule {
  counter += 1;
  return {
    id: `schedule-${String(counter)}`,
    type: 'expense',
    amountPence: 95000,
    categoryId: 'rent_housing',
    description: 'Rent',
    frequency: 'monthly',
    startDate: '2026-09-01',
    nextDueDate: '2026-09-01',
    paused: false,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
    isDemo: false,
    ...overrides,
  };
}
