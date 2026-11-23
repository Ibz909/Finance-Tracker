import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { DataRepository } from '../services/storage/DataRepository';
import { createLocalStorageRepository } from '../services/storage/localStorageRepository';
import type { StorageStatus } from './appDataContext';
import {
  AppDataDispatchContext,
  AppDataStateContext,
  StorageStatusContext,
} from './appDataContext';
import type { AppDataAction } from './appDataReducer';
import { appDataReducer } from './appDataReducer';

const defaultRepository = createLocalStorageRepository();

interface AppDataProviderProps {
  children: ReactNode;
  /** Injectable so tests (and a future API backend) can supply their own. */
  repository?: DataRepository;
}

/**
 * The single source of truth for financial data. Loads once on mount and
 * saves every change as it is dispatched.
 *
 * Why not `useReducer` + a saving `useEffect`? Saving is a consequence of
 * a user action, not of rendering, so it belongs where the action happens.
 * Running the pure reducer here means each change is saved exactly once,
 * and a failed save is reported immediately, without an extra render pass.
 */
export function AppDataProvider({
  children,
  repository = defaultRepository,
}: AppDataProviderProps) {
  const [initialLoad] = useState(() => repository.load());
  const [data, setData] = useState(initialLoad.data);
  // Latest data, so several dispatches in one event build on each other.
  const dataRef = useRef(data);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadProblemDismissed, setLoadProblemDismissed] = useState(false);

  const dispatch = useCallback(
    (action: AppDataAction) => {
      const next = appDataReducer(dataRef.current, action);
      if (next === dataRef.current) return; // nothing changed: no render, no save
      dataRef.current = next;
      setData(next);
      const result = repository.save(next);
      setSaveError(result.ok ? null : result.error);
    },
    [repository],
  );

  const dismissLoadProblem = useCallback(() => {
    setLoadProblemDismissed(true);
  }, []);

  const storageStatus = useMemo<StorageStatus>(() => {
    const load: StorageStatus['load'] =
      initialLoad.status === 'recovered' && !loadProblemDismissed
        ? { status: 'recovered', problem: initialLoad.problem, backupKey: initialLoad.backupKey }
        : { status: initialLoad.status === 'recovered' ? 'ok' : initialLoad.status };
    return { load, saveError, dismissLoadProblem };
  }, [initialLoad, loadProblemDismissed, saveError, dismissLoadProblem]);

  return (
    <StorageStatusContext value={storageStatus}>
      <AppDataDispatchContext value={dispatch}>
        <AppDataStateContext value={data}>{children}</AppDataStateContext>
      </AppDataDispatchContext>
    </StorageStatusContext>
  );
}
