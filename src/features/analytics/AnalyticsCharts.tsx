import { ChartCard } from '../../components/charts/ChartCard';
import { DataTable } from '../../components/charts/DataTable';
import {
  LazyCategoryDonutChart,
  LazyIncomeExpenseChart,
  LazySpendingTrendChart,
} from '../../components/charts/LazyCharts';
import type { MonthKey } from '../../utils/dates';
import { formatMonthLabel } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import type { CategoryTotal, categoryBreakdown, MonthTotals } from './analytics';
import {
  categorySummary,
  hasEnoughTrendData,
  incomeExpenseSummary,
  rangeLabel,
  spendingTrendSummary,
  trendSeries,
} from './analytics';

/*
 * Each card pairs a chart with the same figures in words and in a table.
 * Shared by the Analytics page and the dashboard.
 */

interface MonthlyProps {
  totals: readonly MonthTotals[];
  headingLevel?: 2 | 3;
  title?: string;
}

export function IncomeExpenseCard({
  totals,
  headingLevel,
  title = 'Income vs expenses',
}: MonthlyProps) {
  const empty = totals.every((t) => t.incomePence === 0 && t.expensesPence === 0);
  return (
    <ChartCard
      title={title}
      headingLevel={headingLevel}
      summary={incomeExpenseSummary(totals)}
      emptyMessage={
        empty ? `No income or spending in ${rangeLabel(totals.map((t) => t.month))}.` : undefined
      }
      chart={<LazyIncomeExpenseChart totals={totals} />}
      table={
        <DataTable
          caption={`${title} by month`}
          rows={totals}
          rowKey={(t) => t.month}
          columns={[
            { header: 'Month', cell: (t) => formatMonthLabel(t.month) },
            { header: 'Income', cell: (t) => formatPence(t.incomePence), numeric: true },
            { header: 'Expenses', cell: (t) => formatPence(t.expensesPence), numeric: true },
            { header: 'Net', cell: (t) => formatPence(t.netPence), numeric: true },
          ]}
        />
      }
    />
  );
}

export function SpendingTrendCard({
  totals,
  headingLevel,
  title = 'Spending trend',
}: MonthlyProps) {
  return (
    <ChartCard
      title={title}
      headingLevel={headingLevel}
      summary={spendingTrendSummary(totals)}
      emptyMessage={
        hasEnoughTrendData(totals)
          ? undefined
          : 'A trend needs spending in at least two months. Add more transactions to see one here.'
      }
      chart={<LazySpendingTrendChart points={trendSeries(totals)} />}
      table={
        <DataTable
          caption={`${title} by month`}
          rows={trendSeries(totals)}
          rowKey={(t) => t.month}
          columns={[
            { header: 'Month', cell: (t) => formatMonthLabel(t.month) },
            {
              header: 'Spending',
              cell: (t) =>
                t.expensesPence === null ? 'No records yet' : formatPence(t.expensesPence),
              numeric: true,
            },
          ]}
        />
      }
    />
  );
}

interface BreakdownProps {
  breakdown: ReturnType<typeof categoryBreakdown>;
  months: readonly MonthKey[];
  headingLevel?: 2 | 3;
  title?: string;
}

export function CategoryBreakdownCard({
  breakdown,
  months,
  headingLevel,
  title = 'Spending breakdown',
}: BreakdownProps) {
  return (
    <ChartCard
      title={title}
      headingLevel={headingLevel}
      summary={categorySummary(breakdown, months)}
      emptyMessage={
        breakdown.categories.length === 0 ? `No spending in ${rangeLabel(months)}.` : undefined
      }
      chart={
        <LazyCategoryDonutChart
          categories={breakdown.categories}
          totalPence={breakdown.totalPence}
        />
      }
      table={
        <DataTable<CategoryTotal>
          caption={`${title} by category`}
          rows={breakdown.categories}
          rowKey={(c) => c.categoryId}
          columns={[
            { header: 'Category', cell: (c) => c.label },
            { header: 'Spent', cell: (c) => formatPence(c.totalPence), numeric: true },
            { header: 'Share', cell: (c) => `${String(c.sharePercent)}%`, numeric: true },
          ]}
        />
      }
    />
  );
}
