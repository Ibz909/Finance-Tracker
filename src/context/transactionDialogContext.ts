import { createContext } from 'react';

export type TransactionDialogState =
  { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; id: string };

export interface TransactionDialogContextValue {
  openAddTransaction: () => void;
  openEditTransaction: (id: string) => void;
}

export const TransactionDialogContext = createContext<TransactionDialogContextValue | null>(null);
