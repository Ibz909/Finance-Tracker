import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import type { Transaction } from '../../models/transaction';
import { formatDisplayDate } from '../../utils/dates';
import { formatPence } from '../../utils/money';

interface DeleteTransactionDialogProps {
  /** The transaction awaiting confirmation, or null when closed. */
  transaction: Transaction | null;
  onClose: () => void;
}

export function DeleteTransactionDialog({ transaction, onClose }: DeleteTransactionDialogProps) {
  const { deleteTransaction } = useTransactionActions();
  const { showToast } = useToast();

  return (
    <ConfirmDialog
      open={transaction !== null}
      title={transaction ? `Delete “${transaction.description}”?` : 'Delete transaction?'}
      description={
        transaction && (
          <>
            {formatPence(transaction.amountPence)} {transaction.type} on{' '}
            {formatDisplayDate(transaction.date)}. This can’t be undone.
          </>
        )
      }
      confirmLabel="Delete transaction"
      onCancel={onClose}
      onConfirm={() => {
        if (transaction) {
          deleteTransaction(transaction.id);
          showToast('Transaction deleted');
        }
        onClose();
      }}
    />
  );
}
