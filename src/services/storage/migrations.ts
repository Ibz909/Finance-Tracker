import { CURRENT_SCHEMA_VERSION } from './envelope';

/** Upgrades raw data from one schema version to the next. Must be pure. */
export type Migration = (data: unknown) => unknown;

/**
 * Migration `n` upgrades version n data to version n + 1. Version 1 is the
 * first release, so there are none yet. When a feature such as budgets is
 * added, it registers `1: (data) => ({ ...data, budgets: [] })` and bumps
 * CURRENT_SCHEMA_VERSION to 2.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

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
