import { ProviderError, type ChatMessage, type CompleteOptions, type Provider } from './types';

/**
 * Plain-fetch Groq client (OpenAI-compatible API). No SDK on purpose:
 * ~40 lines we fully understand beats a dependency we'd have to explain.
 */
export function groqProvider(apiKey: string, model: string): Provider {
  return {
    name: 'groq',
    model,
    async complete(messages: ChatMessage[], { signal }: CompleteOptions): Promise<string> {
      let res: Response;
      try {
        res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.4,
            max_tokens: 3000,
            // JSON mode: the model is constrained to emit a JSON object.
            // Recovery layers still apply — JSON mode guarantees syntax,
            // not our schema.
            response_format: { type: 'json_object' },
          }),
        });
      } catch (e) {
        if ((e as Error).name === 'AbortError') throw e;
        throw new ProviderError('NETWORK', `Could not reach Groq: ${(e as Error).message}`);
      }

      if (res.status === 401 || res.status === 403) {
        throw new ProviderError('AUTH', 'Groq rejected the API key.');
      }
      if (res.status === 429) {
        throw new ProviderError('RATE_LIMIT', 'Groq rate limit hit.');
      }
      if (!res.ok) {
        throw new ProviderError('PROVIDER', `Groq returned HTTP ${res.status}.`);
      }

      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return body.choices?.[0]?.message?.content ?? '';
    },
  };
}
