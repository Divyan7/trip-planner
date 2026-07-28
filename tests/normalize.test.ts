import { describe, expect, it } from 'vitest';
import { extractJson } from '../shared/extractJson';
import { normalize } from '../shared/normalize';
import { ItinerarySchema } from '../shared/schema';
import * as fx from './fixtures/badOutputs';

const pipeline = (raw: string) => {
  const parsed = extractJson(raw);
  return parsed === null ? null : normalize(parsed);
};

describe('normalize', () => {
  it('passes through valid output and assigns stable ids', () => {
    const result = pipeline(fx.VALID);
    expect(result).not.toBeNull();
    expect(result!.warnings).toHaveLength(0);
    const ids = result!.itinerary.days.flatMap((d) => d.stops.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ItinerarySchema.safeParse(result!.itinerary).success).toBe(true);
  });

  it('unwraps alternate root keys and aliases field names', () => {
    const result = pipeline(fx.WRONG_SHAPE_WRAPPED)!;
    expect(result.itinerary.title).toBe('Tokyo for foodies');
    const day1 = result.itinerary.days[0];
    expect(day1.dayNumber).toBe(1); // parsed from "Day 1"
    expect(day1.stops[0].name).toBe('Tsukiji outer market');
    expect(day1.stops[0].time).toBe('07:30');
    expect(day1.stops[0].cost).toBe('$3000');
    expect(day1.stops[1].durationMinutes).toBe(120); // "2h"
  });

  it('drops stops without names and reports a warning', () => {
    const result = pipeline(fx.MISSING_NAMES)!;
    expect(result.itinerary.days[0].stops).toHaveLength(2);
    expect(result.warnings.some((w) => w.includes('no name'))).toBe(true);
  });

  it('caps oversized plans and warns about truncation', () => {
    const result = pipeline(fx.OVERSIZED)!;
    expect(result.itinerary.days).toHaveLength(14);
    expect(result.itinerary.days[0].stops).toHaveLength(8);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('keeps an empty days array (empty state, not an error)', () => {
    const result = pipeline(fx.EMPTY_DAYS)!;
    expect(result.itinerary.days).toHaveLength(0);
  });

  it('salvages complete days from a truncated response', () => {
    const result = pipeline(fx.TRUNCATED)!;
    expect(result.itinerary.days.length).toBeGreaterThanOrEqual(1);
    expect(result.itinerary.days[0].stops[0].name).toBe('Blue Lagoon');
  });

  it('returns null for unusable structures', () => {
    expect(normalize('a string')).toBeNull();
    expect(normalize(null)).toBeNull();
    expect(normalize({ noDaysHere: true })).toBeNull();
  });

  it('derives a title when the model omits one', () => {
    const result = normalize({ destination: 'Oslo', days: [{ stops: [{ name: 'Opera House' }] }] })!;
    expect(result.itinerary.title).toContain('Oslo');
  });
});
