import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { ItinerarySchema, type Itinerary } from '@shared/schema';
import {
  canRedo,
  canUndo,
  initialDocState,
  itineraryReducer,
  type DocState,
} from '../state/itineraryReducer';

const STORAGE_KEY = 'trip-planner:v1';

interface PersistedShape {
  present: DocState['present'];
  prompt: string;
}

function hydrate(): { state: DocState; prompt: string } {
  const empty = { state: initialDocState, prompt: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as PersistedShape;
    if (!parsed?.present) return { ...empty, prompt: parsed?.prompt ?? '' };
    // Validate stored data against the current schema — a stale shape from
    // an older version is silently discarded, never crashes the app.
    const valid = ItinerarySchema.safeParse(parsed.present.itinerary);
    if (!valid.success) return empty;
    return {
      state: {
        past: [],
        future: [],
        present: {
          itinerary: valid.data,
          expanded: Array.isArray(parsed.present.expanded) ? parsed.present.expanded : [],
        },
      },
      prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
    };
  } catch {
    return empty;
  }
}

/**
 * The document model: reducer + undo history + debounced persistence,
 * exposed as intent-named actions so components never build action
 * objects (and can't corrupt state shape).
 */
export function useItineraryDocument() {
  const initial = useMemo(hydrate, []);
  const [state, dispatch] = useReducer(itineraryReducer, initial.state);
  const promptRef = useRef(initial.prompt);

  // Debounced persistence, flushed on tab hide so the last write isn't lost.
  const persistTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const write = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ present: state.present, prompt: promptRef.current }),
        );
      } catch {
        /* storage full or disabled — persistence is best-effort */
      }
    };
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(write, 500);
    const flush = () => document.visibilityState === 'hidden' && write();
    document.addEventListener('visibilitychange', flush);
    return () => {
      clearTimeout(persistTimer.current);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [state.present]);

  const setItinerary = useCallback(
    (itinerary: Itinerary) => dispatch({ type: 'SET_ITINERARY', itinerary }),
    [],
  );
  const toggleStop = useCallback((stopId: string) => dispatch({ type: 'TOGGLE_STOP', stopId }), []);
  const expandAll = useCallback(() => dispatch({ type: 'EXPAND_ALL' }), []);
  const collapseAll = useCallback(() => dispatch({ type: 'COLLAPSE_ALL' }), []);
  const removeStop = useCallback(
    (dayId: string, stopId: string) => dispatch({ type: 'REMOVE_STOP', dayId, stopId }),
    [],
  );
  const moveStop = useCallback(
    (dayId: string, from: number, to: number) => dispatch({ type: 'MOVE_STOP', dayId, from, to }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const rememberPrompt = useCallback((p: string) => {
    promptRef.current = p;
  }, []);

  return {
    doc: state.present,
    canUndo: canUndo(state),
    canRedo: canRedo(state),
    initialPrompt: initial.prompt,
    actions: {
      setItinerary,
      toggleStop,
      expandAll,
      collapseAll,
      removeStop,
      moveStop,
      undo,
      redo,
      clear,
      rememberPrompt,
    },
  };
}
