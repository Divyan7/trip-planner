import { groqProvider } from './groq';
import { mockProvider } from './mock';
import type { Provider } from './types';

/**
 * Provider selection: explicit LLM_PROVIDER wins; otherwise use Groq when
 * a key exists and fall back to mock so a clean clone always runs.
 */
export function pickProvider(env: NodeJS.ProcessEnv): Provider {
  const requested = env.LLM_PROVIDER?.toLowerCase();
  const key = env.GROQ_API_KEY;
  const model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (requested === 'mock') return mockProvider();
  if (requested === 'groq') {
    if (!key) {
      console.warn('[trip-planner] LLM_PROVIDER=groq but GROQ_API_KEY is missing — using mock.');
      return mockProvider();
    }
    return groqProvider(key, model);
  }
  if (key) return groqProvider(key, model);

  console.warn('[trip-planner] No GROQ_API_KEY found — running in mock mode (deterministic fixtures).');
  return mockProvider();
}
