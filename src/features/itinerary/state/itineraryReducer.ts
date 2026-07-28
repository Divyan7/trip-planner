import type { Itinerary } from '@shared/schema';

/**
 * The itinerary document: the AI result plus the user's edits to it.
 * Pure reducer — unit-testable, serializable (persistence), and wrapped
 * in an undo/redo history below.
 */

export interface Doc {
  itinerary: Itinerary;
  /** Stop ids currently expanded. Array (not Set) so it serializes. */
  expanded: string[];
}

export interface DocState {
  past: Doc[];
  present: Doc | null;
  future: Doc[];
}

export const initialDocState: DocState = { past: [], present: null, future: [] };

export type DocAction =
  | { type: 'SET_ITINERARY'; itinerary: Itinerary }
  | { type: 'HYDRATE'; state: DocState }
  | { type: 'TOGGLE_STOP'; stopId: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'REMOVE_STOP'; dayId: string; stopId: string }
  | { type: 'MOVE_STOP'; dayId: string; from: number; to: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

const HISTORY_LIMIT = 50;

/** Push the current present into history and apply an edit. */
function commit(state: DocState, next: Doc): DocState {
  return {
    past: [...state.past.slice(-HISTORY_LIMIT + 1), state.present!],
    present: next,
    future: [],
  };
}

/** UI-only changes (expansion) shouldn't pollute undo history. */
function replace(state: DocState, next: Doc): DocState {
  return { ...state, present: next };
}

export function itineraryReducer(state: DocState, action: DocAction): DocState {
  switch (action.type) {
    case 'SET_ITINERARY': {
      // A new generation invalidates all history — undo must never
      // restore stops into a trip that no longer exists.
      const firstStop = action.itinerary.days[0]?.stops[0];
      return {
        past: [],
        present: { itinerary: action.itinerary, expanded: firstStop ? [firstStop.id] : [] },
        future: [],
      };
    }

    case 'HYDRATE':
      return action.state;

    case 'CLEAR':
      return initialDocState;

    case 'UNDO': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: state.present ? [state.present, ...state.future] : state.future,
      };
    }

    case 'REDO': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return {
        past: state.present ? [...state.past, state.present] : state.past,
        present: next,
        future: rest,
      };
    }

    default:
      break;
  }

  const doc = state.present;
  if (!doc) return state;

  switch (action.type) {
    case 'TOGGLE_STOP': {
      const expanded = doc.expanded.includes(action.stopId)
        ? doc.expanded.filter((id) => id !== action.stopId)
        : [...doc.expanded, action.stopId];
      return replace(state, { ...doc, expanded });
    }

    case 'EXPAND_ALL':
      return replace(state, {
        ...doc,
        expanded: doc.itinerary.days.flatMap((d) => d.stops.map((s) => s.id)),
      });

    case 'COLLAPSE_ALL':
      return replace(state, { ...doc, expanded: [] });

    case 'REMOVE_STOP': {
      const days = doc.itinerary.days.map((day) =>
        day.id === action.dayId
          ? { ...day, stops: day.stops.filter((s) => s.id !== action.stopId) }
          : day,
      );
      return commit(state, {
        itinerary: { ...doc.itinerary, days },
        expanded: doc.expanded.filter((id) => id !== action.stopId),
      });
    }

    case 'MOVE_STOP': {
      const days = doc.itinerary.days.map((day) => {
        if (day.id !== action.dayId) return day;
        const { from, to } = action;
        if (from === to || from < 0 || to < 0 || from >= day.stops.length || to >= day.stops.length) {
          return day;
        }
        const stops = [...day.stops];
        const [moved] = stops.splice(from, 1);
        stops.splice(to, 0, moved);
        return { ...day, stops };
      });
      // No-op moves (out of bounds) must not pollute history.
      if (days.every((d, i) => d === doc.itinerary.days[i])) return state;
      return commit(state, { ...doc, itinerary: { ...doc.itinerary, days } });
    }

    default:
      return state;
  }
}

export const canUndo = (s: DocState) => s.past.length > 0;
export const canRedo = (s: DocState) => s.future.length > 0;
