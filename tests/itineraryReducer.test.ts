import { describe, expect, it } from 'vitest';
import {
  itineraryReducer as reduce,
  initialDocState,
  canUndo,
  type DocState,
} from '../src/features/itinerary/state/itineraryReducer';
import type { Itinerary } from '../shared/schema';

const itinerary: Itinerary = {
  title: 'Test trip',
  days: [
    {
      id: 'd1',
      dayNumber: 1,
      stops: [
        { id: 's1', name: 'Castle' },
        { id: 's2', name: 'Market' },
        { id: 's3', name: 'Museum' },
      ],
    },
    { id: 'd2', dayNumber: 2, stops: [{ id: 's4', name: 'Beach' }] },
  ],
};

const loaded = (): DocState => reduce(initialDocState, { type: 'SET_ITINERARY', itinerary });
const stops = (s: DocState, dayId = 'd1') =>
  s.present!.itinerary.days.find((d) => d.id === dayId)!.stops.map((x) => x.id);

describe('itineraryReducer', () => {
  it('loads an itinerary with the first stop expanded and empty history', () => {
    const s = loaded();
    expect(s.present!.expanded).toEqual(['s1']);
    expect(canUndo(s)).toBe(false);
  });

  it('removes a stop and cleans up its expansion state', () => {
    let s = loaded();
    s = reduce(s, { type: 'TOGGLE_STOP', stopId: 's2' });
    s = reduce(s, { type: 'REMOVE_STOP', dayId: 'd1', stopId: 's2' });
    expect(stops(s)).toEqual(['s1', 's3']);
    expect(s.present!.expanded).not.toContain('s2');
  });

  it('moves a stop up and down within a day', () => {
    let s = loaded();
    s = reduce(s, { type: 'MOVE_STOP', dayId: 'd1', from: 2, to: 1 });
    expect(stops(s)).toEqual(['s1', 's3', 's2']);
    s = reduce(s, { type: 'MOVE_STOP', dayId: 'd1', from: 1, to: 2 });
    expect(stops(s)).toEqual(['s1', 's2', 's3']);
  });

  it('ignores out-of-bounds moves without polluting history', () => {
    let s = loaded();
    s = reduce(s, { type: 'MOVE_STOP', dayId: 'd1', from: 0, to: -1 });
    s = reduce(s, { type: 'MOVE_STOP', dayId: 'd1', from: 2, to: 3 });
    expect(stops(s)).toEqual(['s1', 's2', 's3']);
    expect(canUndo(s)).toBe(false);
  });

  it('does not affect other days when moving', () => {
    let s = loaded();
    s = reduce(s, { type: 'MOVE_STOP', dayId: 'd1', from: 0, to: 2 });
    expect(stops(s, 'd2')).toEqual(['s4']);
  });

  it('undoes and redoes a removal', () => {
    let s = loaded();
    s = reduce(s, { type: 'REMOVE_STOP', dayId: 'd1', stopId: 's1' });
    s = reduce(s, { type: 'UNDO' });
    expect(stops(s)).toEqual(['s1', 's2', 's3']);
    s = reduce(s, { type: 'REDO' });
    expect(stops(s)).toEqual(['s2', 's3']);
  });

  it('expansion toggles do not enter undo history', () => {
    let s = loaded();
    s = reduce(s, { type: 'TOGGLE_STOP', stopId: 's3' });
    s = reduce(s, { type: 'EXPAND_ALL' });
    expect(canUndo(s)).toBe(false);
    expect(s.present!.expanded).toHaveLength(4);
  });

  it('a new generation clears history so undo cannot cross trips', () => {
    let s = loaded();
    s = reduce(s, { type: 'REMOVE_STOP', dayId: 'd1', stopId: 's1' });
    expect(canUndo(s)).toBe(true);
    s = reduce(s, { type: 'SET_ITINERARY', itinerary });
    expect(canUndo(s)).toBe(false);
  });
});
