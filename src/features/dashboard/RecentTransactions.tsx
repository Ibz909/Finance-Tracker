import { ArrowRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import type { Transaction } from '../../models/transaction';
import type { MonthKey } from '../../utils/dates';
import { formatMonthLabel } from '../../utils/dates';
import { DeleteTransactionDialog } from '../transactions/DeleteTransactionDialog';
import { TransactionList } from '../transactions/TransactionList';

interface RecentTransactionsProps {
  transactions: readonly Transaction[];
  month: MonthKey;
}

export function RecentTransactions({ transactions, month }: RecentTransactionsProps) {
  const { openAddTransaction, openEditTransaction } = useTransactionDialog();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  return (
    <section
      aria-labelledby="recent-heading"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <h2 id="recent-heading" className="text-base font-semibold">
          Recent transactions
        </h2>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-accent hover:underline"
        >
          View all
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No transactions in {formatMonthLabel(month)}.
          </p>
          <Button variant="secondary" onClick={openAddTransaction}>
            <Plus aria-hidden="true" className="size-4" />
            Add a transaction
          </Button>
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          onEdit={(transaction) => {
            openEditTransaction(transaction.id);
          }}
          onDelete={setPendingDelete}
        />
      )}

      <DeleteTransactionDialog
        transaction={pendingDelete}
        onClose={() => {
          setPendingDelete(null);
        }}
      />
    </section>
  );
}
