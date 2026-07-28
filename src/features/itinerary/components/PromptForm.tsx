import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MAX_PROMPT_LENGTH } from '@shared/schema';

const EXAMPLES = [
  '5 days in Lisbon, food-focused, mid-budget',
  'Weekend in Kyoto with kids — temples and parks',
  '10-day Iceland road trip in October',
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
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="trip-prompt" className="text-sm font-semibold">
        Describe your trip
        <span className="ml-2 font-normal text-muted">
          destination, days, interests, budget — plain words are fine
        </span>
      </label>
      <textarea
        id="trip-prompt"
        value={prompt}
        onChange={(e) => update(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={MAX_PROMPT_LENGTH}
        placeholder="e.g. 4 relaxed days in Barcelona in June, love architecture and seafood, medium budget"
        className="w-full resize-y rounded-xl border border-edge bg-raised p-3 text-sm placeholder:text-muted/70"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" loading={loading} disabled={!trimmed}>
          {loading ? 'Planning…' : hasResult ? 'Regenerate' : 'Plan my trip'}
        </Button>
        {loading && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <span className="hidden text-xs text-muted sm:inline" aria-hidden="true">
          ⌘/Ctrl + Enter
        </span>
      </div>
      {!hasResult && !loading && (
        <div className="flex flex-wrap gap-2" aria-label="Example trips">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="press rounded-full border border-edge bg-raised px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-ink"
              onClick={() => update(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
