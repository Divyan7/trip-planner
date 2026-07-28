import { extractJson } from '../shared/extractJson';
import { normalize } from '../shared/normalize';
import { ItinerarySchema, MAX_PROMPT_LENGTH, type Itinerary } from '../shared/schema';
import { err, ok, type Result } from '../shared/result';
import { repairPrompt, SYSTEM_PROMPT, userPrompt } from './prompt';
import { ProviderError, type ChatMessage, type Provider } from './providers/types';

export interface GenerateRequest {
  prompt?: unknown;
}

/**
 * Framework-agnostic core, shared by the Express dev server and any
 * serverless wrapper. The recovery ladder, in order:
 *
 *   provider call → extractJson (fences/prose/truncation) → normalize
 *   (aliases/coercion/salvage) → schema — and if that ladder fails, ONE
 *   repair round-trip that feeds the validation errors back to the model.
 *
 * A single wall-clock deadline covers the original call AND the repair,
 * so the worst case is bounded regardless of retries.
 */
export async function generateItinerary(
  body: GenerateRequest,
  provider: Provider,
  deadlineMs = 30_000,
): Promise<Result<Itinerary>> {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return err('EMPTY', 'Describe your trip first — a destination and rough length is enough.');
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return err('EMPTY', `That description is too long (max ${MAX_PROMPT_LENGTH} characters).`);
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deadlineMs);
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt(prompt) },
  ];

  let repairAttempts = 0;
  let lastRaw = '';
  let lastIssues: string[] = [];

  try {
    for (let attempt = 0; attempt <= 1; attempt++) {
      repairAttempts = attempt;
      const raw = await provider.complete(messages, { signal: controller.signal });
      lastRaw = raw;

      if (!raw.trim()) {
        lastIssues = ['The model returned an empty response.'];
      } else {
        const parsed = extractJson(raw);
        if (parsed === null) {
          lastIssues = ['The response contained no parseable JSON object.'];
        } else {
          const normalized = normalize(parsed);
          if (normalized) {
            return ok(normalized.itinerary, normalized.warnings, {
              model: `${provider.name}/${provider.model}`,
              latencyMs: Date.now() - started,
              repairAttempts,
            });
          }
          const direct = ItinerarySchema.safeParse(parsed);
          lastIssues = direct.success
            ? ['Unrecognized structure.']
            : direct.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || 'root'}: ${i.message}`);
        }
      }

      // Feed the failure back once; a second failure becomes a typed error.
      if (attempt === 0) {
        messages.push(
          { role: 'assistant', content: lastRaw || '(empty)' },
          { role: 'user', content: repairPrompt(lastIssues) },
        );
      }
    }

    if (!lastRaw.trim()) {
      return err('EMPTY', 'The model returned an empty response twice. Try rephrasing your trip.');
    }
    return err(
      extractJson(lastRaw) === null ? 'UNPARSEABLE' : 'INVALID_SHAPE',
      'The model kept returning data we could not turn into an itinerary.',
      {
        issues: lastIssues,
        ...(process.env.NODE_ENV !== 'production' ? { raw: lastRaw.slice(0, 2000) } : {}),
      },
    );
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      return err('TIMEOUT', `The model took longer than ${Math.round(deadlineMs / 1000)}s.`);
    }
    if (e instanceof ProviderError) {
      const messages: Record<ProviderError['kind'], string> = {
        AUTH: 'The server’s API key is missing or invalid. Check .env (see README).',
        RATE_LIMIT: 'The AI provider rate-limited us. Wait a moment and retry.',
        PROVIDER: 'The AI provider returned an error. Retrying usually fixes this.',
        NETWORK: 'The server could not reach the AI provider. Check your connection.',
      };
      return err(e.kind, messages[e.kind]);
    }
    console.error('[trip-planner] unexpected handler error:', e);
    return err('UNKNOWN', 'Something unexpected went wrong. Please retry.');
  } finally {
    clearTimeout(timer);
  }
}
