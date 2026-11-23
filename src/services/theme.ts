import { STORAGE_KEYS } from '../constants/storageKeys';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

/** What the user chose. */
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
/** What is actually shown once "system" has been resolved. */
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/**
 * Reads the saved preference. Anything missing or unexpected (or storage
 * being unavailable, e.g. blocked by privacy settings) falls back to the
 * default rather than throwing.
 */
export function readThemePreference(storage: Storage | null = safeLocalStorage()): ThemePreference {
  try {
    const value = storage?.getItem(STORAGE_KEYS.theme);
    return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

/** Saves the preference. Returns false if it could not be stored. */
export function writeThemePreference(
  preference: ThemePreference,
  storage: Storage | null = safeLocalStorage(),
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEYS.theme, preference);
    return true;
  } catch {
    return false;
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

/** Applies the resolved theme to <html> so the CSS variables switch. */
export function applyTheme(
  theme: ResolvedTheme,
  root: HTMLElement = document.documentElement,
): void {
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Accessing localStorage itself can throw (e.g. some privacy modes).
    return null;
  }
}
