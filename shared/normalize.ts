import { ItinerarySchema, MAX_DAYS, MAX_STOPS_PER_DAY, type Itinerary } from './schema';
import { newId } from './ids';

export interface NormalizeResult {
  itinerary: Itinerary;
  warnings: string[];
}

/**
 * Turn "roughly right" model output into a valid Itinerary, salvaging what
 * it can and reporting what it dropped. Returns null only when nothing
 * usable can be recovered (the caller then falls back to a repair retry).
 *
 * Handles: alternate root/field names, day numbers as "Day 1"/"1", stops
 * missing names (dropped + warned), oversized plans (truncated + warned),
 * loose types (numbers as strings, cost as number).
 */
export function normalize(input: unknown): NormalizeResult | null {
  if (input === null || typeof input !== 'object') return null;
  const warnings: string[] = [];

  // The payload is sometimes nested under a wrapper key.
  let root = input as Record<string, unknown>;
  for (const key of ['itinerary', 'trip', 'plan', 'result', 'data']) {
    const inner = root[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      root = inner as Record<string, unknown>;
      break;
    }
  }

  const rawDays = pickArray(root, ['days', 'itinerary', 'schedule', 'dailyPlan']);
  if (rawDays === null) return null;

  const days = rawDays
    .filter((d): d is Record<string, unknown> => d !== null && typeof d === 'object')
    .map((d, i) => normalizeDay(d, i, warnings))
    .filter((d) => d !== null);

  if (rawDays.length > MAX_DAYS) {
    warnings.push(`Plan had ${rawDays.length} days; showing the first ${MAX_DAYS}.`);
  }

  const candidate: Itinerary = {
    title: pickString(root, ['title', 'name', 'tripTitle']) ?? deriveTitle(root, days.length),
    destination: pickString(root, ['destination', 'location', 'city']),
    summary: pickString(root, ['summary', 'description', 'overview']),
    days: days.slice(0, MAX_DAYS),
  };

  const parsed = ItinerarySchema.safeParse(candidate);
  if (!parsed.success) return null;
  return { itinerary: parsed.data, warnings };
}

function normalizeDay(
  raw: Record<string, unknown>,
  index: number,
  warnings: string[],
) {
  const rawStops = pickArray(raw, ['stops', 'activities', 'items', 'events', 'places']) ?? [];

  const stops: NonNullable<ReturnType<typeof normalizeStop>>[] = [];
  rawStops
    .filter((s): s is Record<string, unknown> => s !== null && typeof s === 'object')
    .forEach((s, i) => {
      const stop = normalizeStop(s);
      if (stop) stops.push(stop);
      else warnings.push(`Dropped stop ${i + 1} on day ${index + 1} — it had no name.`);
    });

  if (rawStops.length > MAX_STOPS_PER_DAY) {
    warnings.push(
      `Day ${index + 1} had ${rawStops.length} stops; showing the first ${MAX_STOPS_PER_DAY}.`,
    );
  }

  return {
    id: newId(),
    dayNumber: parseDayNumber(raw, index),
    label: pickString(raw, ['label', 'title', 'theme', 'name']),
    stops: stops.slice(0, MAX_STOPS_PER_DAY),
  };
}

function normalizeStop(raw: Record<string, unknown>) {
  const name = pickString(raw, ['name', 'title', 'place', 'activity', 'stop']);
  if (!name) return null;
  return {
    id: newId(),
    name,
    description: pickString(raw, ['description', 'details', 'about']),
    time: pickString(raw, ['time', 'startTime', 'when']),
    durationMinutes: parseDuration(raw),
    category: pickString(raw, ['category', 'type', 'kind'])?.toLowerCase(),
    cost: parseCost(raw),
    tip: pickString(raw, ['tip', 'tips', 'note', 'notes']),
  };
}

/** "Day 3" | "3" | 3 → 3; falls back to position. */
function parseDayNumber(raw: Record<string, unknown>, index: number): number {
  for (const key of ['dayNumber', 'day', 'number']) {
    const v = raw[key];
    if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
    if (typeof v === 'string') {
      const m = v.match(/\d+/);
      if (m) return parseInt(m[0], 10);
    }
  }
  return index + 1;
}

function parseDuration(raw: Record<string, unknown>): number | undefined {
  for (const key of ['durationMinutes', 'duration', 'minutes']) {
    const v = raw[key];
    if (typeof v === 'number' && v > 0 && v <= 24 * 60) return Math.round(v);
    if (typeof v === 'string') {
      const hours = v.match(/([\d.]+)\s*h/i);
      if (hours) return Math.round(parseFloat(hours[1]) * 60);
      const mins = v.match(/(\d+)\s*m/i) ?? v.match(/^(\d+)$/);
      if (mins) {
        const n = parseInt(mins[1], 10);
        if (n > 0 && n <= 24 * 60) return n;
      }
    }
  }
  return undefined;
}

function parseCost(raw: Record<string, unknown>): string | undefined {
  for (const key of ['cost', 'price', 'budget']) {
    const v = raw[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return `$${v}`;
  }
  return undefined;
}

function deriveTitle(root: Record<string, unknown>, dayCount: number): string {
  const dest = pickString(root, ['destination', 'location', 'city']);
  if (dest) return `${dayCount}-day trip to ${dest}`;
  return dayCount > 0 ? `Your ${dayCount}-day itinerary` : 'Your itinerary';
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function pickArray(obj: Record<string, unknown>, keys: string[]): unknown[] | null {
  for (const key of keys) {
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}
