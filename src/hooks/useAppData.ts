import { use } from 'react';
import {
  AppDataDispatchContext,
  AppDataStateContext,
  StorageStatusContext,
} from '../context/appDataContext';

function required<T>(value: T | null, hook: string): T {
  if (value === null) throw new Error(`${hook} must be used inside <AppDataProvider>`);
  return value;
}

/** All persisted app data. Derive totals from it; never store them. */
export function useAppData() {
  return required(use(AppDataStateContext), 'useAppData');
}

/** Low-level dispatch. Prefer feature hooks like useTransactionActions. */
export function useAppDispatch() {
  return required(use(AppDataDispatchContext), 'useAppDispatch');
}

export function useStorageStatus() {
  return required(use(StorageStatusContext), 'useStorageStatus');
}
