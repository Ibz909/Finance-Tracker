import type { Budget } from './budget';
import type { RecurringSchedule } from './recurring';
import type { GoalContribution, SavingsGoal } from './savings';
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
  /** Added in schema version 3. */
  recurringSchedules: RecurringSchedule[];
  /** Added in schema version 4. */
  savingsGoals: SavingsGoal[];
  /** Added in schema version 4. Each belongs to one goal. */
  goalContributions: GoalContribution[];
  settings: Settings;
}

export function createEmptyAppData(): AppData {
  return {
    transactions: [],
    budgets: [],
    recurringSchedules: [],
    savingsGoals: [],
    goalContributions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
