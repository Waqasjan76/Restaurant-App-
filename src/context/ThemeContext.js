import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { darkColors, lightColors } from '../theme/palette';
import { usePersistedState } from '../hooks/usePersistedReducer';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  // The theme choice is remembered between launches.
  const [isDark, setIsDark, isHydrated] = usePersistedState('@restaurant/isDark', false);

  const toggleTheme = useCallback(() => setIsDark((d) => !d), [setIsDark]);

  const value = useMemo(
    () => ({ isDark, toggleTheme, colors: isDark ? darkColors : lightColors, isHydrated }),
    [isDark, toggleTheme, isHydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used inside a <ThemeProvider>. Wrap your app in ThemeProvider.');
  }
  return ctx;
}
