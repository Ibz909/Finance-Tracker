import type { AppData } from '../../models/appData';
import { createEmptyAppData } from '../../models/appData';
import type { DataRepository } from './DataRepository';

/**
 * In-memory DataRepository for tests. `saved` exposes the last write so
 * tests can assert what would have been persisted.
 */
export function createMemoryRepository(initial?: AppData) {
  let saved: AppData | undefined = initial ? structuredClone(initial) : undefined;

  const repository: DataRepository & { readonly saved: AppData | undefined } = {
    get saved() {
      return saved;
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
  };
  return repository;
}
