import { ItinerarySchema, type Itinerary } from '@shared/schema';
import { err, type Meta, type Result } from '@shared/result';

const CLIENT_TIMEOUT_MS = 35_000; // slightly above the server's 30s deadline

export interface GenerationSuccess {
  itinerary: Itinerary;
  warnings: string[];
  meta: Meta;
}

/**
 * POST the prompt and re-validate the response with the SAME Zod schema
 * the server used. A deployed server is still untrusted input to the UI —
 * this catches server/client schema drift and hand-edited responses.
 */
export async function requestItinerary(
  prompt: string,
  signal: AbortSignal,
): Promise<Result<GenerationSuccess>> {
  let res: Response;
  try {
    res = await fetch('/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(CLIENT_TIMEOUT_MS)]),
    });
  } catch (e) {
    const name = (e as Error).name;
    if (name === 'AbortError') throw e; // caller decides what cancel means
    if (name === 'TimeoutError') {
      return err('TIMEOUT', 'The request took too long. Retry, or simplify the trip.');
    }
    return err('NETWORK', 'Could not reach the server. Is it running? (npm start)');
  }

  if (!res.ok) {
    return err(
      res.status === 429 ? 'RATE_LIMIT' : 'PROVIDER',
      `The server responded with HTTP ${res.status}.`,
    );
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return err('UNPARSEABLE', 'The server returned an unreadable response.');
  }

  const result = body as Result<unknown>;
  if (typeof result !== 'object' || result === null || typeof (result as { ok?: unknown }).ok !== 'boolean') {
    return err('UNKNOWN', 'The server returned an unexpected response shape.');
  }
  if (!result.ok) return result as Result<GenerationSuccess>;

  const validated = ItinerarySchema.safeParse(result.data);
  if (!validated.success) {
    return err('INVALID_SHAPE', 'The server sent data the app could not verify.', {
      issues: validated.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }

  return {
    ok: true,
    data: {
      itinerary: validated.data,
      warnings: result.warnings ?? [],
      meta: result.meta,
    },
    warnings: result.warnings ?? [],
    meta: result.meta,
  };
}
