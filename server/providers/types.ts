export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompleteOptions {
  signal: AbortSignal;
}

export interface Provider {
  name: string;
  model: string;
  /** Returns the model's raw text. Throws ProviderError on transport failure. */
  complete(messages: ChatMessage[], opts: CompleteOptions): Promise<string>;
}

export class ProviderError extends Error {
  constructor(
    public kind: 'AUTH' | 'RATE_LIMIT' | 'PROVIDER' | 'NETWORK',
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
