import { formatPence } from '../../utils/money';

/** Compact axis labels from pence: 0 → "£0", 85000 → "£850", 125000 → "£1.3k". */
export function formatAxisPence(pence: number): string {
  const pounds = pence / 100;
  if (Math.abs(pounds) >= 1000) {
    const thousands = pounds / 1000;
    return `£${thousands.toFixed(Math.abs(thousands) >= 10 ? 0 : 1).replace(/\.0$/, '')}k`;
  }
  return `£${String(Math.round(pounds))}`;
}

/** Tooltip values: always the exact amount. */
export function formatTooltipPence(value: unknown): string {
  return typeof value === 'number' ? formatPence(value) : String(value);
}

/**
 * Colours come from the theme's CSS variables, so charts follow light and
 * dark mode without re-rendering.
 */
export const CHART_COLORS = {
  income: 'var(--chart-income)',
  expenses: 'var(--chart-expense)',
  spending: 'var(--accent)',
  grid: 'var(--border)',
  axis: 'var(--muted-foreground)',
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--foreground)',
    fontSize: '0.875rem',
  },
  labelStyle: { color: 'var(--foreground)', fontWeight: 600 },
  itemStyle: { color: 'var(--foreground)' },
} as const;

/**
 * Round axis ticks (£0, £500, £1k, £1.5k…) for values in pence, so the
 * scale reads naturally instead of stepping in odd amounts like £850.
 */
export function niceTicks(maxPence: number, targetCount = 4): number[] {
  if (maxPence <= 0) return [0];
  const rough = maxPence / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ??
    10 * magnitude;
  const top = Math.ceil(maxPence / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}
