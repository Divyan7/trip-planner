import { memo } from 'react';
import type { Day } from '@shared/schema';
import { StopCard } from './StopCard';

interface Props {
  day: Day;
  expanded: string[];
  onToggle: (stopId: string) => void;
  onMove: (dayId: string, from: number, to: number) => void;
  onRemove: (dayId: string, stopId: string, index: number) => void;
}

export const DaySection = memo(function DaySection({ day, expanded, onToggle, onMove, onRemove }: Props) {
  const headingId = `day-heading-${day.id}`;
  return (
    <section aria-labelledby={headingId} className="rise">
      <h3
        id={headingId}
        tabIndex={-1}
        className="mb-2 flex items-baseline gap-2 rounded px-1 text-sm font-bold tracking-wide uppercase"
      >
        <span className="text-accent">Day {day.dayNumber}</span>
        {day.label && <span className="font-semibold normal-case text-muted">· {day.label}</span>}
      </h3>
      {day.stops.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge px-4 py-3 text-sm text-muted">
          No stops left on this day — undo a removal or regenerate.
        </p>
      ) : (
        <ol className="space-y-2">
          {day.stops.map((stop, i) => (
            <StopCard
              key={stop.id}
              stop={stop}
              dayId={day.id}
              index={i}
              count={day.stops.length}
              expanded={expanded.includes(stop.id)}
              onToggle={onToggle}
              onMove={onMove}
              onRemove={onRemove}
            />
          ))}
        </ol>
      )}
    </section>
  );
});
