import type { Dispatch } from 'react';
import { createContext } from 'react';
import type { AppData } from '../models/appData';
import type { LoadResult } from '../services/storage/DataRepository';
import type { AppDataAction } from './appDataReducer';

/*
 * State and dispatch live in separate contexts. `dispatch` is stable,
 * so components that only trigger actions (e.g. a delete button) do not
 * re-render every time any data changes.
 */
export const AppDataStateContext = createContext<AppData | null>(null);
export const AppDataDispatchContext = createContext<Dispatch<AppDataAction> | null>(null);

export interface StorageStatus {
  /** How the initial load went (ok / empty / recovered / unavailable). */
  load: Pick<LoadResult, 'status'> & {
    problem?: string;
    backupKey?: string | null;
  };
  /** Set when the most recent save failed; cleared by the next success. */
  saveError: string | null;
  dismissLoadProblem: () => void;
  /**
   * Deletes all financial data and any recovery backups. The theme is a
   * preference, not data, so it is kept.
   */
  resetAllData: () => void;
}

export const StorageStatusContext = createContext<StorageStatus | null>(null);

/**
 * The app's clock. Injectable so tests control "today"; anything that needs
 * the current date for data (such as recurring payments) reads it here.
 */
export const ClockContext = createContext<(() => Date) | null>(null);

/** How many recurring payments were added when the app opened. */
export interface RecurringCatchUp {
  added: number;
  dismiss: () => void;
}
export const RecurringCatchUpContext = createContext<RecurringCatchUp | null>(null);
