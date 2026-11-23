import { use } from 'react';
import type { ThemeContextValue } from '../context/themeContext';
import { ThemeContext } from '../context/themeContext';

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
