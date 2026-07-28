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

const DAY_GRADIENTS = [
  'linear-gradient(90deg,#6c63ff,#9b59b6)',
  'linear-gradient(90deg,#ff6584,#ff9a56)',
  'linear-gradient(90deg,#43e97b,#38f9d7)',
  'linear-gradient(90deg,#fa8231,#f7b731)',
  'linear-gradient(90deg,#4facfe,#00f2fe)',
  'linear-gradient(90deg,#f093fb,#f5576c)',
  'linear-gradient(90deg,#43e97b,#6c63ff)',
];

export const DaySection = memo(function DaySection({ day, expanded, onToggle, onMove, onRemove }: Props) {
  const headingId = `day-heading-${day.id}`;
  const gradient = DAY_GRADIENTS[(day.dayNumber - 1) % DAY_GRADIENTS.length];

  return (
    <section aria-labelledby={headingId} className="rise">
      {/* Day Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          id={headingId}
          tabIndex={-1}
          style={{
            background: gradient,
            color: '#fff',
            borderRadius: '999px',
            padding: '4px 16px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 12px rgba(108,99,255,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          Day {day.dayNumber}
        </div>
        {day.label && (
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {day.label}
          </span>
        )}
        <div style={{
          flex: 1,
          height: '1px',
          background: 'var(--edge)',
          borderRadius: '1px',
        }} />
        <span style={{
          fontSize: '0.72rem',
          color: 'var(--muted)',
          whiteSpace: 'nowrap',
          fontWeight: 500,
        }}>
          {day.stops.length} {day.stops.length === 1 ? 'stop' : 'stops'}
        </span>
      </div>

      {/* Stops */}
      {day.stops.length === 0 ? (
        <div style={{
          borderRadius: '14px',
          border: '1.5px dashed var(--edge)',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: '0.875rem',
        }}>
          No stops left — undo a removal or regenerate.
        </div>
      ) : (
        <ol style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', margin: 0, padding: 0 }}>
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
