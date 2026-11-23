import {
  CartesianGrid,
  Line,
  LineChart,
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

export function SpendingTrendChart({ totals }: { totals: readonly MonthTotals[] }) {
  const reduceMotion = usePrefersReducedMotion();
  const ticks = niceTicks(Math.max(...totals.map((t) => t.expensesPence), 0));
  const data = totals.map((t) => ({ label: formatShortMonth(t.month), Spending: t.expensesPence }));

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
        <Tooltip formatter={formatTooltipPence} {...TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey="Spending"
          stroke={CHART_COLORS.spending}
          strokeWidth={2.5}
          dot={{ r: 4, fill: CHART_COLORS.spending, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          isAnimationActive={!reduceMotion}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
