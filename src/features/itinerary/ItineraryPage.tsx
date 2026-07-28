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
      toast({ message: `Removed "${stop?.name ?? 'stop'}"`, actionLabel: 'Undo', onAction: actions.undo });
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 80px' }}>

      {/* ── Hero Section ── */}
      {!hasResult && !isLoading && gen.phase !== 'error' && (
        <div style={{ textAlign: 'center', padding: '60px 0 32px' }}>
          <div className="float" style={{ fontSize: '4rem', marginBottom: '16px', display: 'inline-block' }}>
            🌍
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '12px',
              background: 'var(--gradient-hero)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Plan Your Dream Trip
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto' }}>
            Describe where you want to go. Get a beautiful day-by-day itinerary — powered by AI.
          </p>
        </div>
      )}

      {/* ── Prompt Box ── */}
      <section
        className="glass"
        style={{
          borderRadius: '24px',
          padding: '24px 28px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-glow)',
        }}
        aria-label="Trip request"
      >
        <PromptForm
          initialPrompt={initialPrompt}
          loading={isLoading}
          hasResult={hasResult && canUndo}
          onSubmit={submit}
          onCancel={cancel}
          onPromptChange={actions.rememberPrompt}
        />
      </section>

      {/* ── Results ── */}
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
              <div
                role="alert"
                className="glass"
                style={{ borderRadius: '20px', padding: '32px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}
              >
                <p style={{ fontSize: '2.5rem' }}>⚠️</p>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '12px', color: 'var(--ink)' }}>
                  Couldn't display this itinerary
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '8px' }}>
                  Something in the generated data broke the display. Your prompt is safe above — regenerating usually fixes it.
                </p>
                <button
                  className="btn-glow"
                  style={{ marginTop: '20px', borderRadius: '12px', padding: '10px 24px', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  onClick={retry}
                >
                  Regenerate
                </button>
              </div>
            )}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <PartialResultNotice warnings={warnings} onDismiss={() => setWarnings([])} />
              <TripHeader
                itinerary={doc.itinerary}
                canUndo={canUndo}
                onExpandAll={actions.expandAll}
                onCollapseAll={actions.collapseAll}
                onUndo={actions.undo}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
                  Generated by {lastMeta.model} in {(lastMeta.latencyMs / 1000).toFixed(1)}s
                  {lastMeta.repairAttempts > 0 && ` · ${lastMeta.repairAttempts} repair`}
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
