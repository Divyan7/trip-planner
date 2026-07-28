import { useState } from 'react';
import type { Err, ErrorCode } from '@shared/result';
import { Button } from '@/components/ui/Button';

const HEADLINES: Record<ErrorCode, string> = {
  NETWORK: 'Couldn’t reach the server',
  TIMEOUT: 'The model took too long',
  RATE_LIMIT: 'Rate limited',
  AUTH: 'API key problem',
  UNPARSEABLE: 'The model’s reply wasn’t usable JSON',
  INVALID_SHAPE: 'The model returned the wrong shape',
  EMPTY: 'Nothing came back',
  PROVIDER: 'The AI provider had a problem',
  UNKNOWN: 'Something went wrong',
};

const ICONS: Partial<Record<ErrorCode, string>> = {
  TIMEOUT: '⏱',
  RATE_LIMIT: '🚦',
  AUTH: '🔑',
  NETWORK: '📡',
};

interface Props {
  error: Err;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorState({ error, onRetry, onDismiss }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const details = [
    ...(error.issues ?? []),
    ...(error.raw ? [`Raw response:\n${error.raw}`] : []),
  ];

  return (
    <div role="alert" className="rise mx-auto max-w-md rounded-2xl border border-edge bg-raised p-6 text-center card-shadow">
      <p aria-hidden="true" className="text-3xl">
        {ICONS[error.code] ?? '⚠️'}
      </p>
      <h2 className="mt-2 text-lg font-bold">{HEADLINES[error.code] ?? HEADLINES.UNKNOWN}</h2>
      <p className="mt-1 text-sm text-muted">{error.message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          Edit prompt
        </Button>
      </div>
      {details.length > 0 && (
        <div className="mt-4 text-left">
          <button
            type="button"
            aria-expanded={showDetails}
            className="text-xs font-semibold text-muted underline hover:text-ink"
            onClick={() => setShowDetails((s) => !s)}
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
          {showDetails && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-surface p-3 text-xs whitespace-pre-wrap text-muted">
              {details.join('\n')}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
