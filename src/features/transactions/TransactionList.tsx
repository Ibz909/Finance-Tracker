import { Repeat } from 'lucide-react';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { RowMenu } from '../../components/ui/RowMenu';
import { getCategory } from '../../constants/categories';
import type { Transaction } from '../../models/transaction';
import type { IsoDate } from '../../utils/dates';
import { formatDayHeading, formatDisplayDate } from '../../utils/dates';
import { formatPence, formatSignedPence } from '../../utils/money';
import { groupByDate, totalsOf } from './transactionSelectors';

interface TransactionListProps {
  transactions: readonly Transaction[];
  /** Date headings when the list is in date order; a flat list otherwise. */
  groupByDay: boolean;
  caption: string;
  /** For "Today" and "Yesterday" in the day headings. */
  today: IsoDate;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

/**
 * Transactions as a table. In date order each day gets a heading row, so the
 * date isn't repeated on every row; sorted by amount, each row shows its date.
 * Edit and delete sit in each row's menu.
 */
export function TransactionList({
  transactions,
  groupByDay,
  caption,
  today,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const groups = groupByDay
    ? groupByDate(transactions)
    : [{ date: null, transactions: [...transactions] }];

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      {/* Column headings for screen readers; the day headings carry the visual structure. */}
      <thead className="sr-only">
        <tr>
          <th scope="col" className="py-2 pr-3 font-normal">
            Description
          </th>
          <th scope="col" className="py-2 pl-3 text-right font-normal">
            Amount
          </th>
          <th scope="col" className="w-11 py-2">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      {groups.map((group, index) => (
        <tbody key={group.date ?? index}>
          {group.date && (
            <DayHeading date={group.date} today={today} transactions={group.transactions} />
          )}
          {group.transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              showDate={!groupByDay}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      ))}
    </table>
  );
}

function TransactionRow({
  transaction,
  showDate,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  showDate: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  const { description, categoryId, date, type, amountPence, isDemo, recurringScheduleId } =
    transaction;
  const isIncome = type === 'income';

  return (
    <tr className="border-b border-border">
      <td className="py-2.5 pr-3 pl-3">
        <div className="flex items-center gap-3">
          <CategoryIcon categoryId={categoryId} />
          <div className="min-w-0">
            {/* Text wraps rather than truncating, so nothing is cut off on narrow screens. */}
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
              {showDate && (
                <span className="whitespace-nowrap">
                  {' · '}
                  <time dateTime={date}>{formatDisplayDate(date)}</time>
                </span>
              )}
            </p>
          </div>
        </div>
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
          // The date tells apart rows with the same description.
          label={`Actions for ${description}, ${formatDisplayDate(date)}`}
          items={[
            {
              label: 'Edit',
              onSelect: () => {
                onEdit(transaction);
              },
            },
            {
              label: 'Delete',
              destructive: true,
              onSelect: () => {
                onDelete(transaction);
              },
            },
          ]}
        />
      </td>
    </tr>
  );
}

/**
 * A day's heading: "Today", "Yesterday" or the weekday and date, with the
 * day's net total. It sticks under the top bar while that day scrolls by.
 */
function DayHeading({
  date,
  today,
  transactions,
}: {
  date: IsoDate;
  today: IsoDate;
  transactions: readonly Transaction[];
}) {
  const label = formatDayHeading(date, today);
  const { inPence, outPence } = totalsOf(transactions);
  const net = inPence - outPence;

  return (
    <tr>
      <th
        scope="rowgroup"
        colSpan={3}
        className="sticky top-16 z-[1] bg-muted py-1.5 pr-12 pl-3 text-left text-xs font-medium text-muted-foreground"
      >
        <div className="flex items-baseline justify-between gap-3">
          <time dateTime={date}>
            <span aria-hidden="true" className="sm:hidden">
              {label.short}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              {label.long}
            </span>
            <span className="sr-only">
              {/* "Today, Thursday 26 November 2026"; otherwise just the full date. */}
              {label.long === 'Today' || label.long === 'Yesterday'
                ? `${label.long}, ${label.full}`
                : label.full}
            </span>
          </time>
          <span className={net > 0 ? 'text-positive' : undefined}>
            <span className="sr-only">Day total </span>
            {net === 0 ? formatPence(0) : formatSignedPence(Math.abs(net), net > 0 ? 'in' : 'out')}
          </span>
        </div>
      </th>
    </tr>
  );
}
