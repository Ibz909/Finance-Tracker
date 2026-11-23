/**
 * Money rules. All amounts in the app are integer pence (£12.50 → 1250).
 *
 * The upper limit keeps every single amount — and totals of many thousands
 * of them — far below Number.MAX_SAFE_INTEGER (≈ 9 × 10^15), so integer
 * arithmetic stays exact.
 */
export const MAX_AMOUNT_PENCE = 1_000_000_000; // £10,000,000.00
export const CURRENCY = 'GBP';
export const LOCALE = 'en-GB';
