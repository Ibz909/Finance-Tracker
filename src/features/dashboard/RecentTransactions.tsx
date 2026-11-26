import { ArrowRight, Plus, Repeat } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { RowMenu } from '../../components/ui/RowMenu';
import { getCategory } from '../../constants/categories';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import type { Transaction } from '../../models/transaction';
import type { MonthKey } from '../../utils/dates';
import { formatDisplayDate, formatMonthLabel } from '../../utils/dates';
import { formatSignedPence } from '../../utils/money';
import { DeleteTransactionDialog } from '../transactions/DeleteTransactionDialog';

interface RecentTransactionsProps {
  transactions: readonly Transaction[];
  month: MonthKey;
}

/** The month's latest transactions as a compact table; edit and delete sit in each row's menu. */
export function RecentTransactions({ transactions, month }: RecentTransactionsProps) {
  const { openAddTransaction, openEditTransaction } = useTransactionDialog();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  return (
    <section aria-labelledby="recent-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="recent-heading" className="text-lg font-semibold">
          Recent activity
        </h2>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-accent hover:underline"
        >
          All transactions
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="mt-3 flex flex-col items-start gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            No transactions in {formatMonthLabel(month)}.
          </p>
          <Button variant="secondary" onClick={openAddTransaction}>
            <Plus aria-hidden="true" className="size-4" />
            Add a transaction
          </Button>
        </div>
      ) : (
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">Latest transactions in {formatMonthLabel(month)}</caption>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-normal">
                Description
              </th>
              <th scope="col" className="hidden py-2 pr-3 font-normal sm:table-cell">
                Date
              </th>
              <th scope="col" className="py-2 pl-3 text-right font-normal">
                Amount
              </th>
              <th scope="col" className="w-11 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onEdit={() => {
                  openEditTransaction(transaction.id);
                }}
                onDelete={() => {
                  setPendingDelete(transaction);
                }}
              />
            ))}
          </tbody>
        </table>
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

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { description, categoryId, date, type, amountPence, isDemo, recurringScheduleId } =
    transaction;
  const isIncome = type === 'income';
  const dateText = <time dateTime={date}>{formatDisplayDate(date)}</time>;

  return (
    <tr>
      <td className="py-2.5 pr-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5">
            <CategoryIcon categoryId={categoryId} size="inline" />
          </span>
          <div className="min-w-0">
            <p className="break-words text-foreground">{description}</p>
            <p className="text-xs text-muted-foreground">
              {getCategory(categoryId)?.label ?? 'Unknown category'}
              {recurringScheduleId && (
                <>
                  {' · '}
                  <Repeat aria-hidden="true" className="inline size-3 align-[-1px]" /> Recurring
                </>
              )}
              {isDemo && ' · Demo'}
              <span className="whitespace-nowrap sm:hidden"> · {dateText}</span>
            </p>
          </div>
        </div>
      </td>
      <td className="hidden py-2.5 pr-3 whitespace-nowrap text-muted-foreground sm:table-cell">
        {dateText}
      </td>
      <td
        className={`py-2.5 pl-3 text-right font-medium whitespace-nowrap ${
          isIncome ? 'text-positive' : 'text-foreground'
        }`}
      >
        {formatSignedPence(amountPence, isIncome ? 'in' : 'out')}
        <span className="sr-only">{isIncome ? ' income' : ' expense'}</span>
      </td>
      <td className="py-1 pl-1 text-right">
        <RowMenu
          label={`Actions for ${description}`}
          items={[
            { label: 'Edit', onSelect: onEdit },
            { label: 'Delete', onSelect: onDelete, destructive: true },
          ]}
        />
      </td>
    </tr>
  );
}
