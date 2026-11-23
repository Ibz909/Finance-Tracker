import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { ThemePreference } from '../services/theme';
import {
  applyTheme,
  DARK_SCHEME_QUERY,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
} from '../services/theme';
import { ThemeContext } from './themeContext';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy initialisers read storage/media once on mount, not every render.
  const [preference, setPreferenceState] = useState(readThemePreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia(DARK_SCHEME_QUERY).matches,
  );
  const [saveFailed, setSaveFailed] = useState(false);

  // Track the OS setting live, so "system" follows it without a reload.
  useEffect(() => {
    const query = window.matchMedia(DARK_SCHEME_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };
    query.addEventListener('change', handleChange);
    return () => {
      query.removeEventListener('change', handleChange);
    };
  }, []);

  const resolvedTheme = resolveTheme(preference, systemPrefersDark);

  // Layout effect: update <html> before the browser paints the new frame.
  useLayoutEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setSaveFailed(!writeThemePreference(next));
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference, saveFailed }),
    [preference, resolvedTheme, setPreference, saveFailed],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
