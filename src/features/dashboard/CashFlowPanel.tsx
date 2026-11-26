import { useMemo, useState } from 'react';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import type { Transaction } from '../../models/transaction';
import type { MonthKey } from '../../utils/dates';
import { monthlyTotals, monthsEndingAt } from '../analytics/analytics';
import { IncomeExpenseCard } from '../analytics/AnalyticsCharts';

const RANGES = [
  { value: '3', label: '3M', srLabel: '3 months' },
  { value: '6', label: '6M', srLabel: '6 months' },
  { value: '12', label: '12M', srLabel: '12 months' },
] as const;
type RangeValue = (typeof RANGES)[number]['value'];

interface CashFlowPanelProps {
  transactions: readonly Transaction[];
  /** The range always ends with the selected reporting month. */
  month: MonthKey;
}

/** Income vs expenses by month, from the real transaction history. */
export function CashFlowPanel({ transactions, month }: CashFlowPanelProps) {
  const [range, setRange] = useState<RangeValue>('6');
  const months = useMemo(() => monthsEndingAt(month, Number(range)), [month, range]);
  const totals = useMemo(() => monthlyTotals(transactions, months), [transactions, months]);

  return (
    <IncomeExpenseCard
      title="Cash flow"
      totals={totals}
      actions={
        <SegmentedControl
          legend="Cash flow range"
          name="cash-flow-range"
          value={range}
          options={RANGES}
          onChange={setRange}
        />
      }
    />
  );
}
