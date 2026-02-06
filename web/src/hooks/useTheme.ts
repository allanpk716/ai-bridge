import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

/**
 * Detect system theme preference using matchMedia
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve the actual theme to apply (handles 'system' mode)
 */
function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Custom hook for managing theme state
 *
 * Features:
 * - Three modes: light, dark, system (follows OS preference)
 * - localStorage persistence
 * - Real-time system preference detection
 * - Automatic theme class application to document element
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    // Initialize resolved theme on client-side
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const initialTheme = savedTheme || 'system';
      return getResolvedTheme(initialTheme);
    }
    return 'light';
  });

  useEffect(() => {
    // Read saved theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme class to document element
    const root = document.documentElement;
    const actualTheme = getResolvedTheme(theme);

    // Update resolved theme state
    setResolvedTheme(actualTheme);

    // Apply dark class when theme is dark
    if (actualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (theme === 'system') {
        const systemTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);

        if (systemTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    // Add event listener for system theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}
