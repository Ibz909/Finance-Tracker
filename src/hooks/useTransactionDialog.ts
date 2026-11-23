import { use } from 'react';
import { TransactionDialogContext } from '../context/transactionDialogContext';

export function useTransactionDialog() {
  const context = use(TransactionDialogContext);
  if (!context) {
    throw new Error('useTransactionDialog must be used inside <TransactionDialogProvider>');
  }
  return context;
}
