import type { Budget } from './budget';
import type { Settings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import type { Transaction } from './transaction';

/**
 * Everything the app persists. Each new collection arrives with a storage
 * migration (see services/storage/migrations.ts).
 */
export interface AppData {
  transactions: Transaction[];
  /** Added in schema version 2. */
  budgets: Budget[];
  settings: Settings;
}

export function createEmptyAppData(): AppData {
  return { transactions: [], budgets: [], settings: { ...DEFAULT_SETTINGS } };
}
