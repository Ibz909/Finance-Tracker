/**
 * After a new version is deployed, a tab still running the old one asks for
 * page files (chunks) that no longer exist, and following a link fails.
 * Vite reports that as a `vite:preloadError` event; reloading fetches the
 * new version. The reload happens at most once in RELOAD_GUARD_MS, so a
 * real outage shows the error page instead of reloading forever.
 */
export const RELOAD_GUARD_MS = 10_000;
const LAST_RELOAD_KEY = 'finance-tracker:stale-chunk-reload-at';

interface StaleChunkDeps {
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  now: () => number;
  reload: () => void;
}

/** Reloads unless it already did so recently. Returns whether it reloaded. */
export function reloadForNewVersion({ storage, now, reload }: StaleChunkDeps): boolean {
  try {
    const last = Number(storage.getItem(LAST_RELOAD_KEY));
    if (Number.isFinite(last) && now() - last < RELOAD_GUARD_MS) return false;
    storage.setItem(LAST_RELOAD_KEY, String(now()));
  } catch {
    // Storage unavailable: without the guard, don't risk a reload loop.
    return false;
  }
  reload();
  return true;
}

export function installStaleChunkReload(target: Window = window): void {
  target.addEventListener('vite:preloadError', (event) => {
    const reloaded = reloadForNewVersion({
      storage: target.sessionStorage,
      now: () => Date.now(),
      reload: () => {
        target.location.reload();
      },
    });
    // Stop the failed import from also showing the error page mid-reload.
    if (reloaded) event.preventDefault();
  });
}
