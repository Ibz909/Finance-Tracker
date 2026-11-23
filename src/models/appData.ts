import type { Settings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import type { Transaction } from './transaction';

/**
 * Everything the app persists. Later features (budgets, savings goals,
 * recurring schedules) add their collections here with a storage migration.
 */
export interface AppData {
  transactions: Transaction[];
  settings: Settings;
}

export function createEmptyAppData(): AppData {
  return { transactions: [], settings: { ...DEFAULT_SETTINGS } };
}
