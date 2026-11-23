import { Dialog } from '../../components/ui/Dialog';
import type { TransactionDialogState } from '../../context/transactionDialogContext';
import { useAppData } from '../../hooks/useAppData';
import { TransactionForm } from './TransactionForm';

interface TransactionFormDialogProps {
  state: TransactionDialogState;
  onClose: () => void;
}

export function TransactionFormDialog({ state, onClose }: TransactionFormDialogProps) {
  const { transactions } = useAppData();
  const editing = state.mode === 'edit' ? transactions.find((t) => t.id === state.id) : undefined;
  // If the transaction vanished (e.g. deleted elsewhere), there is nothing to edit.
  const open = state.mode === 'add' || editing !== undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit transaction' : 'Add transaction'}
      description={
        editing?.isDemo ? 'This is fictional demo data.' : 'Amounts are in pounds sterling (£).'
      }
    >
      <TransactionForm key={editing?.id ?? 'new'} transaction={editing} onDone={onClose} />
    </Dialog>
  );
}
