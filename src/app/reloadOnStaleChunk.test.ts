import { describe, expect, it, vi } from 'vitest';
import {
  installStaleChunkReload,
  RELOAD_GUARD_MS,
  reloadForNewVersion,
} from './reloadOnStaleChunk';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('reloadForNewVersion', () => {
  it('reloads the first time', () => {
    const reload = vi.fn();

    expect(reloadForNewVersion({ storage: memoryStorage(), now: () => 1_000_000, reload })).toBe(
      true,
    );
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload again straight away, so a real outage can’t loop', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    reloadForNewVersion({ storage, now: () => 1_000_000, reload });

    const again = reloadForNewVersion({
      storage,
      now: () => 1_000_000 + RELOAD_GUARD_MS - 1,
      reload,
    });

    expect(again).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads again once the guard time has passed (a later deploy)', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    reloadForNewVersion({ storage, now: () => 1_000_000, reload });

    expect(reloadForNewVersion({ storage, now: () => 1_000_000 + RELOAD_GUARD_MS, reload })).toBe(
      true,
    );
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('ignores an unreadable stored value', () => {
    const storage = memoryStorage();
    storage.setItem('finance-tracker:stale-chunk-reload-at', 'not a number');
    const reload = vi.fn();

    expect(reloadForNewVersion({ storage, now: () => 1_000_000, reload })).toBe(true);
  });

  it('does not reload when storage is unavailable, since it can’t guard against a loop', () => {
    const reload = vi.fn();
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
    };

    expect(reloadForNewVersion({ storage, now: () => 1_000_000, reload })).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('installStaleChunkReload', () => {
  it('handles Vite’s preload error by reloading instead of failing', () => {
    const target = new EventTarget();
    const reload = vi.fn();
    const fakeWindow = Object.assign(target, {
      sessionStorage: memoryStorage(),
      location: { reload },
    }) as unknown as Window;
    installStaleChunkReload(fakeWindow);

    const event = new Event('vite:preloadError', { cancelable: true });
    fakeWindow.dispatchEvent(event);

    expect(reload).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });
});
