import { Download, Plus, ReceiptText, RotateCcw, SearchX } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { MonthTabs } from '../../components/ui/MonthTabs';
import { getCategory } from '../../constants/categories';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData, useClock } from '../../hooks/useAppData';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import { useToast } from '../../hooks/useToast';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import { useTransactionFilters } from '../../hooks/useTransactionFilters';
import type { Transaction } from '../../models/transaction';
import { formatDisplayDate, formatMonthLabel, todayIsoDate } from '../../utils/dates';
import { downloadTextFile, exportFileName } from '../importExport/download';
import { transactionsToCsv } from '../importExport/transactionCsv';
import { DeleteTransactionDialog } from './DeleteTransactionDialog';
import type { Period, TransactionFilters } from './transactionFilters';
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filterTransactions,
  resolvePeriod,
  sortTransactions,
} from './transactionFilters';
import { TransactionFiltersBar } from './TransactionFiltersBar';
import { TransactionList } from './TransactionList';
import { summarise } from './transactionSelectors';
import { TransactionsSummary } from './TransactionsSummary';

export function TransactionsPage() {
  const { transactions } = useAppData();
  const { openAddTransaction, openEditTransaction } = useTransactionDialog();
  const { filters, updateFilters, resetFilters } = useTransactionFilters();
  const { month: reportingMonth, currentMonth, setMonth: setReportingMonth } = useReportingMonth();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const { showToast } = useToast();
  const clock = useClock();
  const today = todayIsoDate(clock());

  // A month in the URL (a bookmark, Back) becomes the shared reporting month,
  // so Overview and Budgets stay in step with what this page shows.
  useEffect(() => {
    if (filters.month && filters.month !== 'all' && filters.month !== reportingMonth) {
      setReportingMonth(filters.month);
    }
  }, [filters.month, reportingMonth, setReportingMonth]);

  // No month chosen here means "the month the rest of the app is showing".
  const effective: TransactionFilters = useMemo(
    () => ({ ...filters, month: filters.month ?? reportingMonth }),
    [filters, reportingMonth],
  );
  const period = resolvePeriod(filters, reportingMonth);

  // The search box updates immediately; the list catches up a moment later,
  // so typing stays smooth even with a long history.
  const deferredQuery = useDeferredValue(filters.query);
  const visible = useMemo(
    () =>
      sortTransactions(
        filterTransactions(transactions, { ...effective, query: deferredQuery }),
        effective.sort,
      ),
    [transactions, effective, deferredQuery],
  );
  const inPeriod = useMemo(
    () =>
      filterTransactions(transactions, {
        ...DEFAULT_FILTERS,
        month: effective.month,
        from: effective.from,
        to: effective.to,
      }).length,
    [transactions, effective],
  );
  const summary = useMemo(() => summarise(visible), [visible]);
  const activeCount = countActiveFilters(filters);
  const narrowing = narrowingLabels(filters);
  const periodText = periodLabel(period);
  const caption = [periodText, ...narrowing].join(' · ');

  // Both Reset buttons disappear once filters are cleared, which would drop
  // keyboard focus to the page body; send it to the search box instead.
  const handleReset = () => {
    resetFilters();
    document.getElementById('transaction-search')?.focus();
  };
  const choosePeriod = (value: string) => {
    updateFilters({ month: value });
    if (value !== 'all') setReportingMonth(value);
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
      <section aria-labelledby="transactions-heading" className="space-y-5">
        <MonthTabs
          legend="Period"
          value={period.kind === 'month' ? period.month : period.kind === 'all' ? 'all' : null}
          fallbackYear={Number(currentMonth.slice(0, 4))}
          onChange={choosePeriod}
        />

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h2 id="transactions-heading" className="text-lg font-semibold">
              {periodText}
            </h2>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {narrowing.length > 0
                ? `Showing ${String(visible.length)} of ${plural(inPeriod)}`
                : plural(visible.length)}
            </p>
          </div>
          {/* Exports exactly what is shown: the period and every filter. */}
          <Button
            variant="secondary"
            disabled={visible.length === 0}
            aria-label={`Export ${plural(visible.length)} (${caption}) as CSV`}
            onClick={() => {
              downloadTextFile(exportFileName(today), transactionsToCsv(visible));
              showToast(`Exported ${plural(visible.length)}`);
            }}
          >
            <Download aria-hidden="true" className="size-4" />
            Export
          </Button>
        </div>

        {/* An empty period says so below; a row of zeros would only repeat it. */}
        {(visible.length > 0 || activeCount > 0) && (
          <TransactionsSummary
            summary={summary}
            caption={caption}
            type={filters.type}
            narrowed={narrowing.length > 0}
          />
        )}

        <div className="space-y-2">
          <TransactionFiltersBar filters={filters} onChange={updateFilters} />
          {activeCount > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <p className="text-muted-foreground">
                Filtered by{' '}
                <span className="text-foreground">
                  {[...(period.kind === 'custom' ? ['custom dates'] : []), ...narrowing].join(
                    ' · ',
                  )}
                </span>
              </p>
              <Button variant="ghost" className="-ml-2 h-9 px-2 sm:h-8" onClick={handleReset}>
                <RotateCcw aria-hidden="true" className="size-4" />
                Reset filters
              </Button>
            </div>
          )}
        </div>

        {visible.length === 0 ? (
          activeCount > 0 ? (
            <div className="flex flex-col items-center border-t border-border px-6 py-12 text-center">
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
            <div className="flex flex-col items-center border-t border-border px-6 py-12 text-center">
              <ReceiptText aria-hidden="true" className="size-8 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No transactions in {periodText}</h3>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button variant="secondary" onClick={openAddTransaction}>
                  <Plus aria-hidden="true" className="size-4" />
                  Add a transaction
                </Button>
                {period.kind !== 'all' && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      choosePeriod('all');
                    }}
                  >
                    Show all time
                  </Button>
                )}
              </div>
            </div>
          )
        ) : (
          <TransactionList
            transactions={visible}
            today={today}
            groupByDay={filters.sort === 'date-desc' || filters.sort === 'date-asc'}
            caption={`Transactions: ${caption}`}
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

/** "November 2026", "All time", or the custom dates. */
function periodLabel(period: Period): string {
  if (period.kind === 'month') return formatMonthLabel(period.month);
  if (period.kind === 'all') return 'All time';
  const { from, to } = period;
  if (from && to) return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
  if (from) return `From ${formatDisplayDate(from)}`;
  return `Until ${formatDisplayDate(to ?? '')}`;
}

/** The filters narrowing the list within the period, in words. */
function narrowingLabels(filters: TransactionFilters): string[] {
  const labels: string[] = [];
  if (filters.type === 'income') labels.push('Income');
  if (filters.type === 'expense') labels.push('Expenses');
  if (filters.categoryId) labels.push(getCategory(filters.categoryId)?.label ?? 'Unknown category');
  const query = filters.query.trim();
  if (query) labels.push(`matching “${query}”`);
  return labels;
}
