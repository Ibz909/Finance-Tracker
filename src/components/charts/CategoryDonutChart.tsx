import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryTotal } from '../../features/analytics/analytics';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { formatPence } from '../../utils/money';
import { formatTooltipPence, TOOLTIP_STYLE } from './chartFormat';

interface CategoryDonutChartProps {
  categories: readonly CategoryTotal[];
  totalPence: number;
}

/** Donut of spending by category, with a legend that also gives each share in words. */
export function CategoryDonutChart({ categories, totalPence }: CategoryDonutChartProps) {
  const reduceMotion = usePrefersReducedMotion();
  // Each slice takes its colour from its own `fill`, matching the category.
  const data = categories.map((c) => ({ ...c, value: c.totalPence, fill: `var(--${c.color})` }));

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="var(--surface)"
              isAnimationActive={!reduceMotion}
            />
            <Tooltip formatter={formatTooltipPence} {...TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatPence(totalPence)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {categories.map((c) => (
          <li key={c.categoryId} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-full"
              style={{ background: `var(--${c.color})` }}
            />
            <span className="flex-1 truncate">{c.label}</span>
            <span className="text-muted-foreground tabular-nums">{c.sharePercent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
