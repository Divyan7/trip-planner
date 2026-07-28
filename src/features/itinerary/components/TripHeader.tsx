import { useMemo } from 'react';
import type { Itinerary } from '@shared/schema';
import { Button } from '@/components/ui/Button';

interface Props {
  itinerary: Itinerary;
  canUndo: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onUndo: () => void;
}

export function TripHeader({ itinerary, canUndo, onExpandAll, onCollapseAll, onUndo }: Props) {
  const stats = useMemo(() => {
    const stopCount = itinerary.days.reduce((n, d) => n + d.stops.length, 0);
    const minutes = itinerary.days
      .flatMap((d) => d.stops)
      .reduce((n, s) => n + (s.durationMinutes ?? 0), 0);
    return { stopCount, hours: Math.round(minutes / 60) };
  }, [itinerary]);

  return (
    <header className="space-y-2">
      <h2 tabIndex={-1} className="text-xl font-bold [overflow-wrap:anywhere] sm:text-2xl">
        {itinerary.title}
      </h2>
      {itinerary.summary && <p className="text-sm text-muted">{itinerary.summary}</p>}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-ink">
          {itinerary.days.length} {itinerary.days.length === 1 ? 'day' : 'days'}
        </span>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-ink">
          {stats.stopCount} stops
        </span>
        {stats.hours > 0 && (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-ink">
            ~{stats.hours}h planned
          </span>
        )}
        <span className="mx-1 hidden h-4 w-px bg-edge sm:block" aria-hidden="true" />
        <Button variant="ghost" className="!min-h-9 !px-2 !text-xs" onClick={onExpandAll}>
          Expand all
        </Button>
        <Button variant="ghost" className="!min-h-9 !px-2 !text-xs" onClick={onCollapseAll}>
          Collapse all
        </Button>
        {canUndo && (
          <Button variant="ghost" className="!min-h-9 !px-2 !text-xs" onClick={onUndo}>
            ↩ Undo
          </Button>
        )}
      </div>
    </header>
  );
}
