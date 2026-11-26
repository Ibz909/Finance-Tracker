import { formatPence, formatSignedPence } from '../../utils/money';
import type { TypeFilter } from './transactionFilters';
import type { summarise } from './transactionSelectors';

interface TransactionsSummaryProps {
  summary: ReturnType<typeof summarise>;
  /** What the figures cover, e.g. "November 2026 · Expenses", for screen readers. */
  caption: string;
  /** Which type of transaction is listed. */
  type: TypeFilter;
  /** True when search, type or category narrow the period's transactions. */
  narrowed: boolean;
}

/**
 * The figures for exactly the transactions listed below: money in and out
 * on one shared scale, the net, and how many transactions there are.
 */
export function TransactionsSummary({
  summary,
  caption,
  type,
  narrowed,
}: TransactionsSummaryProps) {
  const { inPence, outPence, count } = summary;
  // One scale for both bars, so their lengths compare honestly.
  const scale = Math.max(inPence, outPence);
  const headline = headlineFigure(summary, type, narrowed);
  const width = (pence: number) => (scale === 0 ? '0%' : `${String((pence / scale) * 100)}%`);

  return (
    <section
      aria-label={`Summary for ${caption}`}
      className="rounded-xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-3">
          <BarFigure label="Income" pence={inPence} tone="income" width={width(inPence)} />
          <BarFigure label="Expenses" pence={outPence} tone="expense" width={width(outPence)} />
        </div>
        <div className="flex gap-8 border-t border-border pt-4 sm:flex-col sm:gap-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
          <p>
            <span className="block text-sm text-muted-foreground">{headline.label}</span>
            <span className={`block text-xl font-semibold ${headline.tone}`}>{headline.value}</span>
          </p>
          <p>
            <span className="block text-sm text-muted-foreground">Transactions</span>
            <span className="block text-xl font-semibold">{count}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function BarFigure({
  label,
  pence,
  tone,
  width,
}: {
  label: string;
  pence: number;
  tone: 'income' | 'expense';
  width: string;
}) {
  return (
    <div>
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={`text-base font-semibold ${tone === 'income' && pence > 0 ? 'text-positive' : 'text-foreground'}`}
        >
          {formatPence(pence)}
        </span>
      </p>
      {/* The figure above says it in words; the bar only compares. */}
      <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone === 'income' ? 'bg-chart-income' : 'bg-chart-expense'}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

/**
 * Only an unfiltered period has a true net cash flow. With a type filter the
 * figure is simply what was spent or received; with search or a category it
 * is the net of what's listed. Those stay neutral: they aren't a surplus or
 * a deficit, so turquoise or red would mislead.
 */
function headlineFigure(
  { inPence, outPence, netPence }: ReturnType<typeof summarise>,
  type: TypeFilter,
  narrowed: boolean,
): { label: string; value: string; tone: string } {
  if (type === 'expense') {
    return { label: 'Total spent', value: formatPence(outPence), tone: 'text-foreground' };
  }
  if (type === 'income') {
    return { label: 'Total received', value: formatPence(inPence), tone: 'text-foreground' };
  }
  const value =
    netPence === 0
      ? formatPence(0)
      : formatSignedPence(Math.abs(netPence), netPence > 0 ? 'in' : 'out');
  if (narrowed) return { label: 'Net of listed', value, tone: 'text-foreground' };
  const tone = netPence > 0 ? 'text-positive' : netPence < 0 ? 'text-negative' : 'text-foreground';
  return { label: 'Net cash flow', value, tone };
}
