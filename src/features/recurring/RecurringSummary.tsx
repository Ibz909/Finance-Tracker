import { Metric, MetricList } from '../../components/ui/Metric';
import type { MonthKey } from '../../utils/dates';
import { formatMonthLabel } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import type { RecurringPayment } from './projection';
import { paymentTotals } from './projection';

interface RecurringSummaryProps {
  month: MonthKey;
  payments: readonly RecurringPayment[];
  activeCount: number;
  inactiveCount: number;
}

function paidAndDue(payments: readonly RecurringPayment[]): string | undefined {
  if (payments.length === 0) return undefined;
  const paid = payments.filter((p) => p.status === 'paid').length;
  const due = payments.length - paid;
  return [paid > 0 ? `${String(paid)} paid` : null, due > 0 ? `${String(due)} due` : null]
    .filter(Boolean)
    .join(', ');
}

/** The month's recurring money in three figures: in, out, and how many items are running. */
export function RecurringSummary({
  month,
  payments,
  activeCount,
  inactiveCount,
}: RecurringSummaryProps) {
  const { inPence, outPence } = paymentTotals(payments);
  const income = payments.filter((p) => p.type === 'income');
  const expenses = payments.filter((p) => p.type === 'expense');

  return (
    <section aria-labelledby="recurring-summary-heading" className="space-y-3">
      <h2 id="recurring-summary-heading" className="text-lg font-semibold">
        {formatMonthLabel(month)}
      </h2>
      <MetricList label={`Recurring money, ${formatMonthLabel(month)}`} framed>
        <Metric
          framed
          label="Recurring income"
          value={formatPence(inPence)}
          tone={inPence > 0 ? 'positive' : 'neutral'}
          note={paidAndDue(income)}
        />
        <Metric
          framed
          label="Recurring expenses"
          value={formatPence(outPence)}
          note={paidAndDue(expenses)}
        />
        <Metric
          framed
          label="Active items"
          value={String(activeCount)}
          note={inactiveCount > 0 ? `${String(inactiveCount)} paused or ended` : undefined}
        />
      </MetricList>
    </section>
  );
}
