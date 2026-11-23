import { CURRENCY, LOCALE, MAX_AMOUNT_PENCE } from '../constants/money';

export type ParseAmountResult = { ok: true; pence: number } | { ok: false; error: string };

/** "1,234.5" style: optional thousands groups, then up to two decimals. */
const GROUPED = /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
/** Pounds and/or pence: "12", "12.5", "12.50", ".50". Captures each part. */
const PLAIN = /^(\d*)(?:\.(\d*))?$/;

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

/**
 * Parses what a user typed (e.g. "£1,234.56") into integer pence.
 *
 * Works on the string's digits rather than `parseFloat(x) * 100`, because
 * binary floating point cannot represent most decimals exactly
 * (`1.005 * 100 === 100.49999999999999`).
 */
export function parsePoundsToPence(input: string): ParseAmountResult {
  let text = input.trim().replace(/^£\s*/, '');

  if (text === '') return { ok: false, error: 'Enter an amount' };
  if (text.startsWith('-')) return { ok: false, error: 'Enter an amount greater than zero' };

  if (text.includes(',')) {
    if (!GROUPED.test(text)) return { ok: false, error: 'Check the commas in this amount' };
    text = text.replaceAll(',', '');
  }

  const match = PLAIN.exec(text);
  const pounds = match?.[1] ?? '';
  const fraction = match?.[2];

  if (!match || (pounds === '' && !fraction)) {
    return { ok: false, error: 'Enter an amount in pounds and pence, like 12.50' };
  }
  if (fraction !== undefined && fraction.length > 2) {
    return { ok: false, error: 'Use no more than two decimal places' };
  }
  if (pounds.replace(/^0+/, '').length > 8) {
    return { ok: false, error: `Amount cannot be more than ${formatPence(MAX_AMOUNT_PENCE)}` };
  }

  const pence = Number(pounds || '0') * 100 + Number((fraction ?? '').padEnd(2, '0'));

  if (pence <= 0) return { ok: false, error: 'Enter an amount greater than zero' };
  if (pence > MAX_AMOUNT_PENCE) {
    return { ok: false, error: `Amount cannot be more than ${formatPence(MAX_AMOUNT_PENCE)}` };
  }
  return { ok: true, pence };
}

/** Formats pence for display: 123456 → "£1,234.56". */
export function formatPence(pence: number): string {
  return currencyFormatter.format(pence / 100);
}

/** Formats pence for an editable input: 123456 → "1234.56". */
export function penceToInputValue(pence: number): string {
  const pounds = Math.trunc(pence / 100);
  const remainder = Math.abs(pence % 100);
  return `${pounds}.${String(remainder).padStart(2, '0')}`;
}

/** Sums pence values. Exact, because every value is an integer. */
export function sumPence(values: Iterable<number>): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}
