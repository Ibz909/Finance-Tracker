import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { TransactionFormDialog } from '../features/transactions/TransactionFormDialog';
import type { TransactionDialogState } from './transactionDialogContext';
import { TransactionDialogContext } from './transactionDialogContext';

/**
 * Lets any component (the top bar, a list row, later the dashboard) open
 * the one shared add/edit transaction dialog.
 */
export function TransactionDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TransactionDialogState>({ mode: 'closed' });

  const close = useCallback(() => {
    setState({ mode: 'closed' });
  }, []);

  const value = useMemo(
    () => ({
      openAddTransaction: () => {
        setState({ mode: 'add' });
      },
      openEditTransaction: (id: string) => {
        setState({ mode: 'edit', id });
      },
    }),
    [],
  );

  return (
    <TransactionDialogContext value={value}>
      {children}
      <TransactionFormDialog state={state} onClose={close} />
    </TransactionDialogContext>
  );
}
