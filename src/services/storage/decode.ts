import { z } from 'zod';
import type { AppData } from '../../models/appData';
import type { Budget } from '../../models/budget';
import { budgetKey, budgetSchema } from '../../models/budget';
import { createEmptyAppData } from '../../models/appData';
import { settingsSchema } from '../../models/settings';
import type { Transaction } from '../../models/transaction';
import { transactionSchema } from '../../models/transaction';
import { envelopeSchema } from './envelope';
import { migrate } from './migrations';

export type DecodeResult =
  /** Everything was valid. */
  | { kind: 'valid'; data: AppData }
  /** Usable, but some parts were invalid and dropped or reset. */
  | { kind: 'partial'; data: AppData; problem: string; skippedRecords: number }
  /** Nothing usable. */
  | { kind: 'invalid'; problem: string };

const dataShapeSchema = z.object({
  transactions: z.array(z.unknown()),
  budgets: z.array(z.unknown()),
  settings: z.unknown(),
});

/**
 * Turns whatever was parsed from storage into trustworthy AppData.
 *
 * Validation is per record: one corrupted transaction is dropped rather
 * than discarding hundreds of good ones. Duplicate IDs keep the first copy,
 * and only the first budget per category (or overall) is kept.
 */
export function decodeAppData(raw: unknown): DecodeResult {
  const envelope = envelopeSchema.safeParse(raw);
  if (!envelope.success) {
    return { kind: 'invalid', problem: 'Saved data is not in a recognised format.' };
  }

  const migrated = migrate(envelope.data.data, envelope.data.schemaVersion);
  if (!migrated.ok) return { kind: 'invalid', problem: migrated.problem };

  const shape = dataShapeSchema.safeParse(migrated.data);
  if (!shape.success) {
    return { kind: 'invalid', problem: 'Saved data is missing required sections.' };
  }

  const transactions: Transaction[] = [];
  const seenTransactionIds = new Set<string>();
  let skippedTransactions = 0;

  for (const candidate of shape.data.transactions) {
    const parsed = transactionSchema.safeParse(candidate);
    if (parsed.success && !seenTransactionIds.has(parsed.data.id)) {
      seenTransactionIds.add(parsed.data.id);
      transactions.push(parsed.data);
    } else {
      skippedTransactions++;
    }
  }

  const budgets: Budget[] = [];
  const seenBudgetIds = new Set<string>();
  const seenBudgetKeys = new Set<string>();
  let skippedBudgets = 0;

  for (const candidate of shape.data.budgets) {
    const parsed = budgetSchema.safeParse(candidate);
    const key = parsed.success ? budgetKey(parsed.data) : '';
    if (parsed.success && !seenBudgetIds.has(parsed.data.id) && !seenBudgetKeys.has(key)) {
      seenBudgetIds.add(parsed.data.id);
      seenBudgetKeys.add(key);
      budgets.push(parsed.data);
    } else {
      skippedBudgets++;
    }
  }

  const settings = settingsSchema.safeParse(shape.data.settings);
  const data: AppData = {
    transactions,
    budgets,
    settings: settings.success ? settings.data : createEmptyAppData().settings,
  };

  const skippedRecords = skippedTransactions + skippedBudgets;
  const problems: string[] = [];
  if (skippedTransactions > 0) {
    problems.push(
      `${String(skippedTransactions)} saved transaction${skippedTransactions === 1 ? ' was' : 's were'} invalid and skipped.`,
    );
  }
  if (skippedBudgets > 0) {
    problems.push(
      `${String(skippedBudgets)} saved budget${skippedBudgets === 1 ? ' was' : 's were'} invalid or duplicated and skipped.`,
    );
  }
  if (!settings.success) problems.push('Settings were invalid and have been reset.');

  return problems.length === 0
    ? { kind: 'valid', data }
    : { kind: 'partial', data, problem: problems.join(' '), skippedRecords };
}
