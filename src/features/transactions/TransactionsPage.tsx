import { Plus, ReceiptText, RotateCcw, SearchX } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../hooks/useAppData';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import { useTransactionFilters } from '../../hooks/useTransactionFilters';
import type { Transaction } from '../../models/transaction';
import { DeleteTransactionDialog } from './DeleteTransactionDialog';
import { countActiveFilters, filterTransactions, sortTransactions } from './transactionFilters';
import { TransactionFiltersBar } from './TransactionFiltersBar';
import { TransactionList } from './TransactionList';

export function TransactionsPage() {
  const { transactions } = useAppData();
  const { openAddTransaction, openEditTransaction } = useTransactionDialog();
  const { filters, updateFilters, resetFilters } = useTransactionFilters();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  // The search box updates immediately; the list catches up a moment later,
  // so typing stays smooth even with a long history.
  const deferredQuery = useDeferredValue(filters.query);
  const visible = useMemo(
    () =>
      sortTransactions(
        filterTransactions(transactions, { ...filters, query: deferredQuery }),
        filters.sort,
      ),
    [transactions, filters, deferredQuery],
  );
  const activeCount = countActiveFilters(filters);

  // Both Reset buttons disappear once filters are cleared, which would drop
  // keyboard focus to the page body; send it to the search box instead.
  const handleReset = () => {
    resetFilters();
    document.getElementById('transaction-search')?.focus();
  };
  const total = transactions.length;
  const plural = (n: number) => `${String(n)} transaction${n === 1 ? '' : 's'}`;

  if (total === 0) {
    return (
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
    );
  }

  return (
    <>
      <section
        aria-labelledby="transactions-heading"
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <h2 id="transactions-heading" className="text-base font-semibold">
            All transactions
          </h2>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {activeCount > 0
              ? `Showing ${String(visible.length)} of ${plural(total)}`
              : plural(total)}
          </p>
        </div>

        <TransactionFiltersBar
          filters={filters}
          activeCount={activeCount}
          onChange={updateFilters}
          onReset={handleReset}
        />

        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <SearchX aria-hidden="true" className="size-8 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No transactions match these filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search or widen the dates.
            </p>
            <Button variant="secondary" className="mt-5" onClick={handleReset}>
              <RotateCcw aria-hidden="true" className="size-4" />
              Reset filters
            </Button>
          </div>
        ) : (
          <TransactionList
            transactions={visible}
            onEdit={(transaction) => {
              openEditTransaction(transaction.id);
            }}
            onDelete={setPendingDelete}
          />
        )}
      </section>

      <DeleteTransactionDialog
        transaction={pendingDelete}
        onClose={() => {
          setPendingDelete(null);
        }}
      />
    </>
  );
}
