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
  income: 'var(--positive)',
  expenses: 'var(--chart-2)',
  spending: 'var(--accent)',
  grid: 'var(--border)',
  axis: 'var(--muted-foreground)',
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    color: 'var(--foreground)',
    fontSize: '0.875rem',
  },
  labelStyle: { color: 'var(--foreground)', fontWeight: 600 },
  itemStyle: { color: 'var(--foreground)' },
} as const;
