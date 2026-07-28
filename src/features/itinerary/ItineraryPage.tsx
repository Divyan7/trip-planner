import { useCallback, useRef, useState } from 'react';
import { useItineraryDocument } from './hooks/useItineraryDocument';
import { useGeneration } from './hooks/useGeneration';
import { useAnnouncer } from '@/components/LiveRegion';
import { useToast } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { PromptForm } from './components/PromptForm';
import { TripHeader } from './components/TripHeader';
import { DaySection } from './components/DaySection';
import { LoadingSkeleton } from './components/states/LoadingSkeleton';
import { ErrorState } from './components/states/ErrorState';
import { EmptyState } from './components/states/EmptyState';
import { PartialResultNotice } from './components/states/PartialResultNotice';
import type { GenerationSuccess } from '@/lib/apiClient';

export function ItineraryPage() {
  const { doc, canUndo, initialPrompt, actions } = useItineraryDocument();
  const announce = useAnnouncer();
  const toast = useToast();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastMeta, setLastMeta] = useState<GenerationSuccess['meta'] | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const lastPromptRef = useRef('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const onSuccess = useCallback(
    (result: GenerationSuccess) => {
      actions.setItinerary(result.itinerary);
      setWarnings(result.warnings);
      setLastMeta(result.meta);
      setGenerationCount((c) => c + 1);
      const stops = result.itinerary.days.reduce((n, d) => n + d.stops.length, 0);
      if (result.itinerary.days.length === 0) {
        announce('No itinerary came back. Try adding a destination and a number of days.');
      } else {
        announce(`Itinerary ready: ${result.itinerary.days.length} days, ${stops} stops.`);
        // Move focus to the result so keyboard/AT users land on it.
        requestAnimationFrame(() => {
          resultsRef.current?.querySelector<HTMLElement>('h2')?.focus();
        });
      }
    },
    [actions, announce],
  );

  const { state: gen, generate, cancel, dismissError } = useGeneration(onSuccess);

  const submit = useCallback(
    (prompt: string) => {
      lastPromptRef.current = prompt;
      announce('Generating your itinerary…');
      generate(prompt);
    },
    [generate, announce],
  );

  const retry = useCallback(() => {
    if (lastPromptRef.current) submit(lastPromptRef.current);
    else dismissError();
  }, [submit, dismissError]);

  const handleRemove = useCallback(
    (dayId: string, stopId: string, index: number) => {
      const day = doc?.itinerary.days.find((d) => d.id === dayId);
      const stop = day?.stops.find((s) => s.id === stopId);
      actions.removeStop(dayId, stopId);
      const remaining = (day?.stops.length ?? 1) - 1;
      announce(`${stop?.name ?? 'Stop'} removed. ${remaining} stops remain on day ${day?.dayNumber}.`);
      toast({ message: `Removed “${stop?.name ?? 'stop'}”`, actionLabel: 'Undo', onAction: actions.undo });
      // Keep keyboard flow going: focus the next stop's remove button,
      // or the day heading when the last stop went.
      requestAnimationFrame(() => {
        const daySection = document.getElementById(`day-heading-${dayId}`)?.closest('section');
        const buttons = daySection?.querySelectorAll<HTMLElement>('[data-remove-button]');
        if (buttons?.length) buttons[Math.min(index, buttons.length - 1)].focus();
        else document.getElementById(`day-heading-${dayId}`)?.focus();
      });
    },
    [doc, actions, announce, toast],
  );

  const handleMove = useCallback(
    (dayId: string, from: number, to: number) => {
      actions.moveStop(dayId, from, to);
      const day = doc?.itinerary.days.find((d) => d.id === dayId);
      const stop = day?.stops[from];
      announce(`${stop?.name ?? 'Stop'} moved to position ${to + 1} of ${day?.stops.length ?? 0}.`);
      // Focus follows the moved card so repeated presses keep working.
      requestAnimationFrame(() => {
        const card = document.querySelector<HTMLElement>(`[data-stop-card="${stop?.id}"]`);
        card?.querySelector<HTMLElement>('button')?.focus();
      });
    },
    [doc, actions, announce],
  );

  const isLoading = gen.phase === 'loading';
  const hasResult = !!doc && doc.itinerary.days.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-32 sm:pb-12">
      <section aria-label="Trip request" className="rounded-2xl border border-edge bg-raised/60 p-4 sm:p-5">
        <PromptForm
          initialPrompt={initialPrompt}
          loading={isLoading}
          hasResult={hasResult && canUndo}
          onSubmit={submit}
          onCancel={cancel}
          onPromptChange={actions.rememberPrompt}
        />
      </section>

      <div ref={resultsRef} aria-busy={isLoading}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : gen.phase === 'error' ? (
          <ErrorState error={gen.error} onRetry={retry} onDismiss={dismissError} />
        ) : !doc ? (
          <EmptyState variant="first-run" />
        ) : doc.itinerary.days.length === 0 ? (
          <EmptyState variant="no-results" />
        ) : (
          <ErrorBoundary
            resetKey={generationCount}
            fallback={() => (
              <div role="alert" className="mx-auto max-w-md rounded-2xl border border-edge bg-raised p-6 text-center">
                <h2 className="text-lg font-bold">We couldn’t display this itinerary</h2>
                <p className="mt-1 text-sm text-muted">
                  Something in the generated data broke the display. Your prompt is safe above —
                  regenerating usually fixes it.
                </p>
                <Button variant="primary" className="mt-4" onClick={retry}>
                  Regenerate
                </Button>
              </div>
            )}
          >
            <div className="space-y-6">
              <PartialResultNotice warnings={warnings} onDismiss={() => setWarnings([])} />
              <TripHeader
                itinerary={doc.itinerary}
                canUndo={canUndo}
                onExpandAll={actions.expandAll}
                onCollapseAll={actions.collapseAll}
                onUndo={actions.undo}
              />
              <div className="space-y-6">
                {doc.itinerary.days.map((day) => (
                  <DaySection
                    key={day.id}
                    day={day}
                    expanded={doc.expanded}
                    onToggle={actions.toggleStop}
                    onMove={handleMove}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
              {lastMeta && (
                <p className="text-center text-xs text-muted">
                  Generated by {lastMeta.model} in {(lastMeta.latencyMs / 1000).toFixed(1)}s
                  {lastMeta.repairAttempts > 0 && ` · ${lastMeta.repairAttempts} repair attempt`}
                  {' · '}
                  <span title="Alt+↑ / Alt+↓ reorders the focused stop">Alt+↑↓ to reorder</span>
                </p>
              )}
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
