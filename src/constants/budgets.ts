/**
 * Budget status thresholds, as a percentage of the limit used.
 *   below WARNING              → on track
 *   WARNING up to below LIMIT  → nearing limit
 *   LIMIT and above            → over budget
 * Change them here and every budget, card and test follows.
 */
export const BUDGET_WARNING_PERCENT = 75;
export const BUDGET_EXCEEDED_PERCENT = 100;
