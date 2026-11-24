import type { AppData } from '../../models/appData';

/**
 * The only way the app reads or writes its data. Components never touch
 * localStorage; they go through the AppData context, which uses a
 * DataRepository. Swapping to Supabase or a REST API means writing a new
 * implementation of this interface (and, since a network is involved,
 * making these methods async) without changing any UI component.
 */
export interface DataRepository {
  load(): LoadResult;
  save(data: AppData): SaveResult;
  /**
   * Deletes copies of damaged data kept during recovery. Part of a full
   * reset: someone deleting all their data expects nothing left behind.
   */
  clearBackups(): SaveResult;
}

export type LoadResult =
  /** Stored data was read and is fully valid. */
  | { status: 'ok'; data: AppData }
  /** Nothing stored yet (first visit or after a reset). */
  | { status: 'empty'; data: AppData }
  /**
   * Stored data had problems. `data` holds whatever could be salvaged
   * (possibly nothing); the original was copied to `backupKey` if possible.
   */
  | {
      status: 'recovered';
      data: AppData;
      problem: string;
      skippedRecords: number;
      backupKey: string | null;
    }
  /** Storage cannot be used at all (blocked, disabled). Data lives in memory only. */
  | { status: 'unavailable'; data: AppData };

export type SaveResult = { ok: true } | { ok: false; error: string };
