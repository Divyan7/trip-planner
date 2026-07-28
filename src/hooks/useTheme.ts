import { useCallback, useEffect, useSyncExternalStore } from 'react';

const THEME_KEY = 'trip-planner:theme';
const listeners = new Set<() => void>();

function currentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
}

/** Dark by default; follows OS preference on first visit; choice persists. */
export function useTheme() {
  // Initialize theme on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
      if (stored === 'light' || stored === 'dark') {
        applyTheme(stored);
      } else {
        // Default to dark
        applyTheme('dark');
      }
    } catch {
      applyTheme('dark');
    }
    listeners.forEach((l) => l());
  }, []);

  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    currentTheme,
  );

  const toggle = useCallback(() => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* best-effort */
    }
    listeners.forEach((l) => l());
  }, []);

  return { theme, toggle };
}
