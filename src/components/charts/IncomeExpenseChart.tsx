import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthTotals } from '../../features/analytics/analytics';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { formatShortMonth } from '../../utils/dates';
import {
  CHART_COLORS,
  formatAxisPence,
  formatTooltipPence,
  niceTicks,
  TOOLTIP_STYLE,
} from './chartFormat';

export function IncomeExpenseChart({ totals }: { totals: readonly MonthTotals[] }) {
  const reduceMotion = usePrefersReducedMotion();
  const ticks = niceTicks(
    Math.max(...totals.map((t) => Math.max(t.incomePence, t.expensesPence)), 0),
  );
  const data = totals.map((t) => ({
    label: formatShortMonth(t.month),
    Income: t.incomePence,
    Expenses: t.expensesPence,
  }));

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
        />
        <YAxis
          width={52}
          tickLine={false}
          axisLine={false}
          ticks={ticks}
          domain={[0, ticks[ticks.length - 1] ?? 0]}
          tickFormatter={formatAxisPence}
          tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
        />
        <Tooltip
          formatter={formatTooltipPence}
          cursor={{ fill: 'var(--muted)' }}
          {...TOOLTIP_STYLE}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="Income"
          fill={CHART_COLORS.income}
          radius={[4, 4, 0, 0]}
          isAnimationActive={!reduceMotion}
        />
        <Bar
          dataKey="Expenses"
          fill={CHART_COLORS.expenses}
          radius={[4, 4, 0, 0]}
          isAnimationActive={!reduceMotion}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
