import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { MAX_PROMPT_LENGTH } from '@shared/schema';

const EXAMPLES = [
  '5 days in Lisbon, food-focused, mid-budget',
  'Weekend in Kyoto with kids — temples & parks',
  '10-day Iceland road trip in October',
  '7 days in Rajasthan, culture & forts',
  '4 days in Tokyo, anime & street food',
];

interface Props {
  initialPrompt: string;
  loading: boolean;
  hasResult: boolean;
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
  onPromptChange: (prompt: string) => void;
}

export function PromptForm({ initialPrompt, loading, hasResult, onSubmit, onCancel, onPromptChange }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const trimmed = prompt.trim();

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
  };

  const update = (value: string) => {
    setPrompt(value);
    onPromptChange(value);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Label */}
      <div>
        <label
          htmlFor="trip-prompt"
          style={{ display: 'block', fontWeight: 700, fontSize: '1rem', marginBottom: '4px', color: 'var(--ink)' }}
        >
          Where do you want to go?
        </label>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          Destination · days · interests · budget — plain words work perfectly
        </span>
      </div>

      {/* Textarea */}
      <textarea
        id="trip-prompt"
        className="trip-textarea"
        value={prompt}
        onChange={(e) => update(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={MAX_PROMPT_LENGTH}
        placeholder="e.g. 5 relaxed days in Barcelona in June — love architecture, seafood, and sunset walks, medium budget"
      />

      {/* Actions Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          id="plan-trip-btn"
          type="submit"
          disabled={!trimmed || loading}
          className="btn-glow"
          style={{
            borderRadius: '12px',
            padding: '11px 28px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#fff',
            border: 'none',
            cursor: trimmed && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '150px',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 14, height: 14,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Planning…
            </>
          ) : (
            <>{hasResult ? '✨ Regenerate' : '🗺️ Plan my trip'}</>
          )}
        </button>

        {loading && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: 'var(--muted)',
              background: 'var(--edge)',
              border: '1px solid var(--edge-strong)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Cancel
          </button>
        )}

        <span style={{ fontSize: '0.73rem', color: 'var(--muted)', marginLeft: 'auto' }}>
          ⌘/Ctrl + Enter
        </span>
      </div>

      {/* Example chips */}
      {!hasResult && !loading && (
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Try an example
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className="example-chip"
                onClick={() => update(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}
