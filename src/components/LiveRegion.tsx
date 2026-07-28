import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const AnnouncerContext = createContext<(message: string) => void>(() => {});

/** Screen-reader announcements for state changes the eye sees instantly. */
export function useAnnouncer() {
  return useContext(AnnouncerContext);
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const tick = useRef(0);

  const announce = useCallback((next: string) => {
    // Alternating a zero-width suffix forces re-announcement of repeats.
    tick.current ^= 1;
    setMessage(next + (tick.current ? '​' : ''));
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div aria-live="polite" role="status" className="sr-only">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}
