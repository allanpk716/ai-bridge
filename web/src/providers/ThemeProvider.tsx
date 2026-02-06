import { createContext, useContext, ReactNode } from 'react';
import { useTheme as useThemeHook, Theme } from '../hooks/useTheme';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider component that provides theme context to all children
 *
 * Wraps the application with theme state management using useTheme hook
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeHook();

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * Must be used within ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
