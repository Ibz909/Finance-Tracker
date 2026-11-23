import type { AppData } from '../models/appData';
import type { Budget } from '../models/budget';
import { budgetKey } from '../models/budget';
import { createEmptyAppData } from '../models/appData';
import type { Transaction, TransactionDraft } from '../models/transaction';

/**
 * Every change to app data is one of these actions. The reducer is pure:
 * IDs and timestamps are created *before* dispatch and passed in, so the
 * same action always produces the same state (easy to test and reason about).
 */
export type AppDataAction =
  | { type: 'transactionAdded'; transaction: Transaction }
  | { type: 'transactionUpdated'; id: string; changes: TransactionDraft; updatedAt: string }
  | { type: 'transactionDeleted'; id: string }
  | { type: 'budgetAdded'; budget: Budget }
  /** Only the limit can change; what a budget is for is fixed once created. */
  | { type: 'budgetUpdated'; id: string; limitPence: number; updatedAt: string }
  | { type: 'budgetDeleted'; id: string }
  /**
   * Replaces any existing demo records with these. Real records are never
   * touched, and a demo budget is skipped if a real budget already covers
   * the same category (or overall), so the user's own limit always wins.
   */
  | { type: 'demoDataLoaded'; transactions: Transaction[]; budgets: Budget[] }
  /** Removes every record flagged isDemo, and nothing else. */
  | { type: 'demoDataCleared' }
  | { type: 'dataReset' };

export function appDataReducer(state: AppData, action: AppDataAction): AppData {
  switch (action.type) {
    case 'transactionAdded':
      return { ...state, transactions: [...state.transactions, action.transaction] };

    case 'transactionUpdated': {
      if (!state.transactions.some((t) => t.id === action.id)) return state;
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id
            ? // Keep identity and system fields (id, createdAt, isDemo, recurring link).
              { ...applyChanges(t, action.changes), updatedAt: action.updatedAt }
            : t,
        ),
      };
    }

    case 'transactionDeleted': {
      const transactions = state.transactions.filter((t) => t.id !== action.id);
      // Same reference when nothing changed, so nothing is re-saved or re-rendered.
      return transactions.length === state.transactions.length ? state : { ...state, transactions };
    }

    case 'budgetAdded':
      return { ...state, budgets: [...state.budgets, action.budget] };

    case 'budgetUpdated': {
      if (!state.budgets.some((b) => b.id === action.id)) return state;
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === action.id
            ? { ...b, limitPence: action.limitPence, updatedAt: action.updatedAt }
            : b,
        ),
      };
    }

    case 'budgetDeleted': {
      const budgets = state.budgets.filter((b) => b.id !== action.id);
      return budgets.length === state.budgets.length ? state : { ...state, budgets };
    }

    case 'demoDataLoaded': {
      const realBudgets = state.budgets.filter((b) => !b.isDemo);
      const taken = new Set(realBudgets.map(budgetKey));
      return {
        ...state,
        transactions: [...state.transactions.filter((t) => !t.isDemo), ...action.transactions],
        budgets: [...realBudgets, ...action.budgets.filter((b) => !taken.has(budgetKey(b)))],
      };
    }

    case 'demoDataCleared': {
      const transactions = state.transactions.filter((t) => !t.isDemo);
      const budgets = state.budgets.filter((b) => !b.isDemo);
      const unchanged =
        transactions.length === state.transactions.length &&
        budgets.length === state.budgets.length;
      return unchanged ? state : { ...state, transactions, budgets };
    }

    case 'dataReset':
      return createEmptyAppData();
  }
}

/** Clearing notes in the form must remove them, not leave the old value. */
function applyChanges(current: Transaction, changes: TransactionDraft): Transaction {
  const next: Transaction = { ...current, ...changes };
  if (changes.notes === undefined || changes.notes === '') delete next.notes;
  return next;
}
