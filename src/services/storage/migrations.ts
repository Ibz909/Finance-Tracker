import { CURRENT_SCHEMA_VERSION } from './envelope';

/** Upgrades raw data from one schema version to the next. Must be pure. */
export type Migration = (data: unknown) => unknown;

/**
 * Migration `n` upgrades version n data to version n + 1. Each one must be
 * pure and must never drop data it does not understand.
 *
 * History:
 *   1 → 2  Budgets added: start with an empty list.
 *   2 → 3  Recurring schedules added: start with an empty list.
 *   3 → 4  Savings goals and their contributions added: start empty.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  1: (data) => (isRecord(data) ? { ...data, budgets: [] } : data),
  2: (data) => (isRecord(data) ? { ...data, recurringSchedules: [] } : data),
  3: (data) => (isRecord(data) ? { ...data, savingsGoals: [], goalContributions: [] } : data),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type MigrationResult = { ok: true; data: unknown } | { ok: false; problem: string };

export function migrate(
  data: unknown,
  fromVersion: number,
  toVersion: number = CURRENT_SCHEMA_VERSION,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): MigrationResult {
  if (fromVersion > toVersion) {
    return {
      ok: false,
      problem: `Saved data is from a newer version of the app (v${String(fromVersion)}).`,
    };
  }

  let current = data;
  for (let version = fromVersion; version < toVersion; version++) {
    const step = migrations[version];
    if (!step) {
      return {
        ok: false,
        problem: `No upgrade path from data version ${String(version)}.`,
      };
    }
    current = step(current);
  }
  return { ok: true, data: current };
}
