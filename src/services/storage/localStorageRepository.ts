import { STORAGE_KEYS } from '../../constants/storageKeys';
import type { AppData } from '../../models/appData';
import { createEmptyAppData } from '../../models/appData';
import type { DataRepository, LoadResult, SaveResult } from './DataRepository';
import { decodeAppData } from './decode';
import type { Envelope } from './envelope';
import { CURRENT_SCHEMA_VERSION } from './envelope';

interface Options {
  /** Returns the Storage to use. Injected so tests can simulate failures. */
  getStorage?: () => Storage;
  key?: string;
  now?: () => Date;
}

/**
 * DataRepository backed by window.localStorage.
 *
 * Never throws. If stored data is damaged it keeps what it can, copies the
 * original to a backup key first, and only then rewrites the cleaned data,
 * so nothing is destroyed without a copy.
 */
export function createLocalStorageRepository({
  getStorage = () => window.localStorage,
  key = STORAGE_KEYS.data,
  now = () => new Date(),
}: Options = {}): DataRepository {
  function tryGetStorage(): Storage | null {
    try {
      const storage = getStorage();
      // Some browsers expose localStorage but throw on first use.
      const probe = `${key}:probe`;
      storage.setItem(probe, probe);
      storage.removeItem(probe);
      return storage;
    } catch {
      return null;
    }
  }

  function write(storage: Storage, data: AppData): SaveResult {
    const envelope: Envelope = { schemaVersion: CURRENT_SCHEMA_VERSION, data };
    try {
      storage.setItem(key, JSON.stringify(envelope));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: describeWriteError(error) };
    }
  }

  function backUp(storage: Storage, raw: string): string | null {
    const backupKey = `${STORAGE_KEYS.dataBackupPrefix}${now().toISOString()}`;
    try {
      storage.setItem(backupKey, raw);
      return backupKey;
    } catch {
      return null;
    }
  }

  function recover(
    storage: Storage,
    raw: string,
    data: AppData,
    problem: string,
    skippedRecords: number,
  ): LoadResult {
    const backupKey = backUp(storage, raw);
    // Only replace the original once a copy of it exists.
    if (backupKey) write(storage, data);
    return { status: 'recovered', data, problem, skippedRecords, backupKey };
  }

  return {
    load() {
      const storage = tryGetStorage();
      if (!storage) return { status: 'unavailable', data: createEmptyAppData() };

      let raw: string | null;
      try {
        raw = storage.getItem(key);
      } catch {
        return { status: 'unavailable', data: createEmptyAppData() };
      }
      if (raw === null) return { status: 'empty', data: createEmptyAppData() };

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return recover(storage, raw, createEmptyAppData(), 'Saved data could not be read.', 0);
      }

      const decoded = decodeAppData(parsed);
      switch (decoded.kind) {
        case 'valid':
          return { status: 'ok', data: decoded.data };
        case 'partial':
          return recover(storage, raw, decoded.data, decoded.problem, decoded.skippedRecords);
        case 'invalid':
          return recover(storage, raw, createEmptyAppData(), decoded.problem, 0);
      }
    },

    save(data) {
      const storage = tryGetStorage();
      if (!storage) {
        return { ok: false, error: 'Browser storage is unavailable, so changes cannot be saved.' };
      }
      return write(storage, data);
    },

    clearBackups() {
      const storage = tryGetStorage();
      if (!storage) return { ok: false, error: 'Browser storage is unavailable.' };
      try {
        // Collect first: removing while iterating by index would skip keys.
        const backupKeys: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const name = storage.key(i);
          if (name?.startsWith(STORAGE_KEYS.dataBackupPrefix)) backupKeys.push(name);
        }
        for (const name of backupKeys) storage.removeItem(name);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Old backup copies could not be deleted from browser storage.' };
      }
    },
  };
}

function describeWriteError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'Browser storage is full, so the latest changes could not be saved.';
  }
  return 'The latest changes could not be saved to browser storage.';
}
