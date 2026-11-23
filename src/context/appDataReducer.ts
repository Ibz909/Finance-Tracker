import type { AppData } from '../models/appData';
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
