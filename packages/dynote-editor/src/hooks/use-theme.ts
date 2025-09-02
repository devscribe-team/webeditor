import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

export function useTheme(): {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
} {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return 'auto';
    }

    // First check localStorage for user preference
    const savedTheme = localStorage.getItem('dynote-theme') as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
      return savedTheme;
    }

    // Default to auto mode
    return 'auto';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    if (theme === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return theme === 'dark' ? 'dark' : 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    if (typeof window !== 'undefined') {
      localStorage.setItem('dynote-theme', newTheme);
    }
  };

  const toggleTheme = () => {
    if (theme === 'auto') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('auto');
    }
  };

  // Listen for system theme changes and update resolved theme
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Set initial resolved theme based on current preference
    if (theme === 'auto') {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme === 'dark' ? 'dark' : 'light');
    }

    // Use the newer addEventListener API if available, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - Legacy API
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - Legacy API
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  // Apply resolved theme to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // Remove existing theme classes
      root.classList.remove('dark', 'light');

      // Add the resolved theme class
      root.classList.add(resolvedTheme);
    }
  }, [resolvedTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
