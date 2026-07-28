import { useState } from 'react';

interface Props {
  warnings: string[];
  onDismiss: () => void;
}

/**
 * The state most apps skip: the result rendered, but not all of it.
 * Salvaging 4 good days and saying what was dropped beats failing hard.
 */
export function PartialResultNotice({ warnings, onDismiss }: Props) {
  const [open, setOpen] = useState(false);
  if (!warnings.length) return null;

  return (
    <div className="rise rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm" role="status">
      <div className="flex items-center gap-2">
        <span aria-hidden="true">⚠️</span>
        <p className="flex-1 font-semibold text-warn">
          Some of the plan couldn’t be used — {warnings.length}{' '}
          {warnings.length === 1 ? 'item was' : 'items were'} skipped.
        </p>
        <button
          type="button"
          aria-expanded={open}
          className="text-xs font-semibold text-warn underline"
          onClick={() => setOpen((s) => !s)}
        >
          {open ? 'Hide' : 'What was skipped?'}
        </button>
        <button
          type="button"
          aria-label="Dismiss warning"
          className="press text-warn"
          onClick={onDismiss}
        >
          ✕
        </button>
      </div>
      {open && (
        <ul className="mt-2 list-disc space-y-1 pl-6 text-xs text-warn">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
