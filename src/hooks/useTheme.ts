import { useCallback, useSyncExternalStore } from 'react';

const THEME_KEY = 'trip-planner:theme';
const listeners = new Set<() => void>();

function currentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/** Follows the OS until the user toggles; the choice then persists. */
export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    currentTheme,
  );

  const toggle = useCallback(() => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (next === 'dark') document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* best-effort */
    }
    listeners.forEach((l) => l());
  }, []);

  return { theme, toggle };
}
