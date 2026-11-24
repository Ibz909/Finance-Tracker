import { Pencil, Repeat, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { getCategory } from '../../constants/categories';
import type { Transaction } from '../../models/transaction';
import { formatDisplayDate } from '../../utils/dates';
import { formatSignedPence } from '../../utils/money';

interface TransactionListProps {
  transactions: readonly Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

/**
 * One responsive list for every screen size: single rows on wider screens;
 * on phones the edit/delete actions wrap onto a second line. Type is spelled out, not shown by colour alone.
 */
export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  return (
    <ul className="divide-y divide-border">
      {transactions.map((transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: { transaction: Transaction } & Omit<TransactionListProps, 'transactions'>) {
  const { description, categoryId, date, type, amountPence, isDemo, recurringScheduleId } =
    transaction;
  const isIncome = type === 'income';

  return (
    <li className="flex flex-wrap items-center gap-x-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-6">
      <CategoryIcon categoryId={categoryId} />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          <span className="truncate">{description}</span>
          {recurringScheduleId && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              <Repeat aria-hidden="true" className="size-3" />
              Recurring
            </span>
          )}
          {isDemo && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Demo
            </span>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {getCategory(categoryId)?.label ?? 'Unknown category'} ·{' '}
          <time dateTime={date}>{formatDisplayDate(date)}</time>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`font-semibold tabular-nums ${isIncome ? 'text-positive' : 'text-foreground'}`}
        >
          {formatSignedPence(amountPence, isIncome ? 'in' : 'out')}
        </p>
        <p className="text-xs text-muted-foreground">{isIncome ? 'Income' : 'Expense'}</p>
      </div>

      {/* On phones the actions wrap onto their own line so the description keeps its room. */}
      <div className="-mb-2 flex shrink-0 basis-full justify-end sm:mb-0 sm:basis-auto">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${description}`}
          onClick={() => {
            onEdit(transaction);
          }}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-negative"
          aria-label={`Delete ${description}`}
          onClick={() => {
            onDelete(transaction);
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </li>
  );
}
