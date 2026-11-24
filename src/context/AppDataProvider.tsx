import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataRepository } from '../services/storage/DataRepository';
import { createLocalStorageRepository } from '../services/storage/localStorageRepository';
import { nowIsoDateTime, todayIsoDate } from '../utils/dates';
import type { RecurringCatchUp, StorageStatus } from './appDataContext';
import {
  AppDataDispatchContext,
  AppDataStateContext,
  ClockContext,
  RecurringCatchUpContext,
  StorageStatusContext,
} from './appDataContext';
import type { AppDataAction } from './appDataReducer';
import { appDataReducer } from './appDataReducer';

const defaultRepository = createLocalStorageRepository();
const systemClock = () => new Date();

interface AppDataProviderProps {
  children: ReactNode;
  /** Injectable so tests (and a future API backend) can supply their own. */
  repository?: DataRepository;
  /** The current time. Injectable so tests never depend on the real date. */
  clock?: () => Date;
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
  clock = systemClock,
}: AppDataProviderProps) {
  // Loading also adds any recurring payments that fell due while the app
  // was closed. Both steps are pure, so this is safe in an initialiser.
  const [initial] = useState(() => {
    const load = repository.load();
    const time = clock();
    const data = appDataReducer(load.data, {
      type: 'recurringCaughtUp',
      today: todayIsoDate(time),
      now: nowIsoDateTime(time),
    });
    return { load, data, added: data.transactions.length - load.data.transactions.length };
  });
  const initialLoad = initial.load;
  const [data, setData] = useState(initial.data);
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

  // Persist payments added on load. This is what effects are for: syncing
  // with an outside system after render. It sets no state; if the save
  // fails, the next change retries it and reports the problem.
  useEffect(() => {
    if (initial.data !== initial.load.data) repository.save(initial.data);
  }, [initial, repository]);

  const [catchUpDismissed, setCatchUpDismissed] = useState(false);
  const recurringCatchUp = useMemo<RecurringCatchUp>(
    () => ({
      added: catchUpDismissed ? 0 : initial.added,
      dismiss: () => {
        setCatchUpDismissed(true);
      },
    }),
    [catchUpDismissed, initial.added],
  );

  const dismissLoadProblem = useCallback(() => {
    setLoadProblemDismissed(true);
  }, []);

  const resetAllData = useCallback(() => {
    dispatch({ type: 'dataReset' });
    const cleared = repository.clearBackups();
    if (!cleared.ok) setSaveError(cleared.error);
    // Messages about the old data no longer apply.
    setLoadProblemDismissed(true);
    setCatchUpDismissed(true);
  }, [dispatch, repository]);

  const storageStatus = useMemo<StorageStatus>(() => {
    const load: StorageStatus['load'] =
      initialLoad.status === 'recovered' && !loadProblemDismissed
        ? { status: 'recovered', problem: initialLoad.problem, backupKey: initialLoad.backupKey }
        : { status: initialLoad.status === 'recovered' ? 'ok' : initialLoad.status };
    return { load, saveError, dismissLoadProblem, resetAllData };
  }, [initialLoad, loadProblemDismissed, saveError, dismissLoadProblem, resetAllData]);

  return (
    <ClockContext value={clock}>
      <StorageStatusContext value={storageStatus}>
        <RecurringCatchUpContext value={recurringCatchUp}>
          <AppDataDispatchContext value={dispatch}>
            <AppDataStateContext value={data}>{children}</AppDataStateContext>
          </AppDataDispatchContext>
        </RecurringCatchUpContext>
      </StorageStatusContext>
    </ClockContext>
  );
}
