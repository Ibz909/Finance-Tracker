import { lazy } from 'react';

/*
 * Recharts is large, so charts are loaded on demand in their own chunk.
 * Figures and summaries render immediately; ChartCard shows a placeholder
 * until the chart code arrives.
 */
export const LazyIncomeExpenseChart = lazy(() =>
  import('./IncomeExpenseChart').then((m) => ({ default: m.IncomeExpenseChart })),
);
export const LazySpendingTrendChart = lazy(() =>
  import('./SpendingTrendChart').then((m) => ({ default: m.SpendingTrendChart })),
);
export const LazyCategoryDonutChart = lazy(() =>
  import('./CategoryDonutChart').then((m) => ({ default: m.CategoryDonutChart })),
);
