import type { AppData } from '../../models/appData';
import { createEmptyAppData } from '../../models/appData';
import type { DataRepository } from './DataRepository';

/**
 * In-memory DataRepository for tests. `saved` exposes the last write so
 * tests can assert what would have been persisted.
 */
export function createMemoryRepository(initial?: AppData) {
  let saved: AppData | undefined = initial ? structuredClone(initial) : undefined;
  let backupsCleared = 0;

  const repository: DataRepository & {
    readonly saved: AppData | undefined;
    /** How many times clearBackups was called. */
    readonly backupsCleared: number;
  } = {
    get saved() {
      return saved;
    },
    get backupsCleared() {
      return backupsCleared;
    },
    load() {
      return saved
        ? { status: 'ok', data: structuredClone(saved) }
        : { status: 'empty', data: createEmptyAppData() };
    },
    save(data) {
      saved = structuredClone(data);
      return { ok: true };
    },
    clearBackups() {
      backupsCleared += 1;
      return { ok: true };
    },
  };
  return repository;
}
