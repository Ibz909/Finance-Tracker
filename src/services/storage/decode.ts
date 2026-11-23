import { z } from 'zod';
import type { AppData } from '../../models/appData';
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
  settings: z.unknown(),
});

/**
 * Turns whatever was parsed from storage into trustworthy AppData.
 *
 * Validation is per record: one corrupted transaction is dropped rather
 * than discarding hundreds of good ones. Duplicate IDs keep the first copy.
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
  const seenIds = new Set<string>();
  let skippedRecords = 0;

  for (const candidate of shape.data.transactions) {
    const parsed = transactionSchema.safeParse(candidate);
    if (parsed.success && !seenIds.has(parsed.data.id)) {
      seenIds.add(parsed.data.id);
      transactions.push(parsed.data);
    } else {
      skippedRecords++;
    }
  }

  const settings = settingsSchema.safeParse(shape.data.settings);
  const data: AppData = {
    transactions,
    settings: settings.success ? settings.data : createEmptyAppData().settings,
  };

  const problems: string[] = [];
  if (skippedRecords > 0) {
    problems.push(
      `${String(skippedRecords)} saved transaction${skippedRecords === 1 ? ' was' : 's were'} invalid and skipped.`,
    );
  }
  if (!settings.success) problems.push('Settings were invalid and have been reset.');

  return problems.length === 0
    ? { kind: 'valid', data }
    : { kind: 'partial', data, problem: problems.join(' '), skippedRecords };
}
