import { z } from 'zod';

/**
 * Single source of truth for the itinerary shape. Imported by BOTH the
 * server (validates raw model output after normalization) and the client
 * (re-validates the API response, guarding against server/client drift).
 */

export const StopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  time: z.string().optional(),
  durationMinutes: z.number().int().positive().max(24 * 60).optional(),
  category: z.string().optional(),
  cost: z.string().optional(),
  tip: z.string().optional(),
});

export const DaySchema = z.object({
  id: z.string().min(1),
  dayNumber: z.number().int().positive(),
  label: z.string().optional(),
  stops: z.array(StopSchema).max(8),
});

export const ItinerarySchema = z.object({
  title: z.string().min(1),
  destination: z.string().optional(),
  summary: z.string().optional(),
  days: z.array(DaySchema).max(14),
});

export type Stop = z.infer<typeof StopSchema>;
export type Day = z.infer<typeof DaySchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;

export const MAX_DAYS = 14;
export const MAX_STOPS_PER_DAY = 8;
export const MAX_PROMPT_LENGTH = 2000;
