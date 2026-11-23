import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  applyTheme,
  isThemePreference,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
} from './theme';

/** A Storage whose every method throws, like a blocked or full localStorage. */
const brokenStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
} as unknown as Storage;

describe('isThemePreference', () => {
  it.each(['light', 'dark', 'system'])('accepts %s', (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each(['', 'Dark', 'blue', null, undefined, 1])('rejects %s', (value) => {
    expect(isThemePreference(value)).toBe(false);
  });
});

describe('readThemePreference', () => {
  it('returns a valid stored preference', () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'dark');
    expect(readThemePreference(localStorage)).toBe('dark');
  });

  it('defaults to system when nothing is stored', () => {
    expect(readThemePreference(localStorage)).toBe('system');
  });

  it('defaults to system when the stored value is corrupted', () => {
    localStorage.setItem(STORAGE_KEYS.theme, '{"oops":true}');
    expect(readThemePreference(localStorage)).toBe('system');
  });

  it('defaults to system when storage throws or is unavailable', () => {
    expect(readThemePreference(brokenStorage)).toBe('system');
    expect(readThemePreference(null)).toBe('system');
  });
});

describe('writeThemePreference', () => {
  it('stores the preference and reports success', () => {
    expect(writeThemePreference('light', localStorage)).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('light');
  });

  it('reports failure instead of throwing when storage is unusable', () => {
    expect(writeThemePreference('dark', brokenStorage)).toBe(false);
    expect(writeThemePreference('dark', null)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it.each([
    ['light', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['dark', true, 'dark'],
    ['system', false, 'light'],
    ['system', true, 'dark'],
  ] as const)('%s with system dark=%s resolves to %s', (preference, systemDark, expected) => {
    expect(resolveTheme(preference, systemDark)).toBe(expected);
  });
});

describe('applyTheme', () => {
  it('adds and removes the dark class and sets color-scheme', () => {
    const root = document.createElement('html');

    applyTheme('dark', root);
    expect(root).toHaveClass('dark');
    expect(root.style.colorScheme).toBe('dark');

    applyTheme('light', root);
    expect(root).not.toHaveClass('dark');
    expect(root.style.colorScheme).toBe('light');
  });
});
