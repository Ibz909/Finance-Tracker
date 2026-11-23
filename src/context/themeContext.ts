import { createContext } from 'react';
import type { ResolvedTheme, ThemePreference } from '../services/theme';

export interface ThemeContextValue {
  /** What the user chose: light, dark or system. */
  preference: ThemePreference;
  /** What is actually on screen after resolving "system". */
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  /** True if the last change could not be saved (storage unavailable). */
  saveFailed: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
