import { Plus, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../hooks/useAppData';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import type { Transaction } from '../../models/transaction';
import { DeleteTransactionDialog } from './DeleteTransactionDialog';
import { TransactionList } from './TransactionList';
import { sortByNewest } from './transactionSelectors';

export function TransactionsPage() {
  const { transactions } = useAppData();
  const { openAddTransaction, openEditTransaction } = useTransactionDialog();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const sorted = useMemo(() => sortByNewest(transactions), [transactions]);

  return (
    <>
      {sorted.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No transactions yet"
          description="Add your income and spending to start tracking where your money goes. Everything stays in this browser."
          action={
            <Button onClick={openAddTransaction}>
              <Plus aria-hidden="true" className="size-5" />
              Add your first transaction
            </Button>
          }
        />
      ) : (
        <section
          aria-labelledby="transactions-heading"
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
            <h2 id="transactions-heading" className="text-base font-semibold">
              All transactions
            </h2>
            <p className="text-sm text-muted-foreground">
              {sorted.length} {sorted.length === 1 ? 'transaction' : 'transactions'}
            </p>
          </div>
          <TransactionList
            transactions={sorted}
            onEdit={(transaction) => {
              openEditTransaction(transaction.id);
            }}
            onDelete={setPendingDelete}
          />
        </section>
      )}

      <DeleteTransactionDialog
        transaction={pendingDelete}
        onClose={() => {
          setPendingDelete(null);
        }}
      />
    </>
  );
}
