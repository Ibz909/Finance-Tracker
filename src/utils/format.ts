import { LOCALE } from '../constants/money';

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * 62.4 → "62.4%", -25 → "−25.0%". Uses a true minus sign, matching how
 * negative amounts are shown, and which screen readers announce as "minus".
 */
export function formatPercent(value: number): string {
  return `${percentFormatter.format(value).replace('-', '−')}%`;
}
