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
